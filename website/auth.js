import { supabase } from './supabase-client.js';
const form = document.querySelector('#auth-form');
const status = document.querySelector('#status');
const dashboard = document.querySelector('#private-area');
const setStatus = (message, error = false) => {
  if (status) { status.textContent = message; status.dataset.error = String(error); }
};
const authPage = new URL('./auth.html', location.href);
const dashboardPage = new URL('./dashboard.html', location.href);
// Recovery links establish a session; do not treat that as a normal login.
let recoveringPassword = new URLSearchParams(location.search).get('type') === 'recovery' ||
  new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery';

if (form) {
  // Never auto-redirect from the login page: password recovery links can
  // establish a valid session before PASSWORD_RECOVERY is emitted.
  // Users reach the dashboard only after an explicit successful login/signup.
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
  const recoveryForm = document.querySelector('#recovery-form');
  const showRecovery = () => {
    recoveringPassword = true;
    form.hidden = true;
    recoveryForm.hidden = false;
    setStatus('請設定新密碼以完成密碼重設。');
  };
  if (recoveringPassword) showRecovery();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') showRecovery();
  });
  recoveryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!recoveryForm.reportValidity()) return;
    const button = document.querySelector('#save-password');
    button.disabled = true;
    try {
      const password = document.querySelector('#new-password').value;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setStatus('密碼已更新，但登出失敗：' + signOutError.message, true);
        return;
      }
      recoveringPassword = false;
      recoveryForm.hidden = true;
      form.hidden = false;
      form.reset();
      setStatus('密碼已更新，請使用新密碼登入。');
    } catch (error) {
      setStatus(error.message || '密碼更新失敗，請重試。', true);
    } finally {
      button.disabled = false;
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
    const logout = document.querySelector('#logout');
    logout.disabled = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      location.replace(authPage.href);
    } catch (error) {
      logout.disabled = false;
      if (checking) {
        checking.hidden = false;
        checking.textContent = '登出失敗，請重試：' + (error.message || '連線異常');
      }
    }
  });
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') { dashboard.hidden = true; location.replace(authPage.href); }
  });
  void checkAccess();
}
