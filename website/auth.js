import { supabase } from './supabase-client.js';
const form = document.querySelector('#auth-form');
const status = document.querySelector('#status');
const dashboard = document.querySelector('#private-area');
const setStatus = (message, error = false) => {
  if (status) { status.textContent = message; status.dataset.error = String(error); }
};
const authPage = new URL('./auth.html', location.href);
const dashboardPage = new URL('./dashboard.html', location.href);

if (form) {
  // If a verified session already exists, no need to log in again.
  supabase.auth.getUser().then(({ data, error }) => {
    if (!error && data.user) location.replace(dashboardPage.href);
  }).catch(() => {});
  let busy = false;
  async function handleAuth(mode) {
    if (busy || !form.reportValidity()) return;
    busy = true;
    [...form.querySelectorAll('button')].forEach(el => el.disabled = true);
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#password').value;
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: dashboardPage.href }
        });
        if (error) throw error;
        if (data.session) location.replace(dashboardPage.href);
        else setStatus('已提交註冊申請。如果需要驗證電子郵件，請查看信箱。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.replace(dashboardPage.href);
      }
    } catch (error) {
      setStatus(error.message || '驗證失敗，請稍後再試。', true);
    } finally {
      busy = false;
      [...form.querySelectorAll('button')].forEach(el => el.disabled = false);
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); void handleAuth('login'); });
  document.querySelector('#signup').addEventListener('click', () => void handleAuth('signup'));
  document.querySelector('#reset').addEventListener('click', async () => {
    const email = document.querySelector('#email');
    if (!email.reportValidity()) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
        redirectTo: authPage.href
      });
      if (error) throw error;
      setStatus('若此信箱可使用密碼重設功能，請依收到的郵件操作。');
    } catch (error) { setStatus(error.message || '無法寄送重設郵件。', true); }
  });
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      const password = window.prompt('請輸入新密碼（至少 6 個字元）');
      if (password && password.length >= 6) {
        setTimeout(async () => {
          const { error } = await supabase.auth.updateUser({ password });
          setStatus(error ? error.message : '密碼已更新，請登入。', !!error);
          if (!error) await supabase.auth.signOut();
        }, 0);
      }
    }
  });
}

if (dashboard) {
  const checking = document.querySelector('#checking');
  async function checkAccess() {
    try {
      // getUser validates the session with the Auth server; do not trust localStorage alone.
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user || data.user.is_anonymous) {
        location.replace(authPage.href);
        return;
      }
      document.querySelector('#member-email').textContent = data.user.email || '已驗證會員';
      dashboard.hidden = false;
      checking.hidden = true;
    } catch {
      location.replace(authPage.href);
    }
  }
  document.querySelector('#logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.replace(authPage.href);
  });
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') { dashboard.hidden = true; location.replace(authPage.href); }
  });
  void checkAccess();
}
