(() => {
  const form = document.querySelector('#queue-form');
  const statusEl = document.querySelector('#queue-status');
  const endpoint = window?.MAUYUAN_CONFIG?.googleEndpoint;

  if (!form || !statusEl) {
    return;
  }

  const setStatus = (message, tone = 'normal') => {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!endpoint || endpoint.includes('REPLACE_ME')) {
      setStatus('尚未設定 Google 端點，請先更新 config.js。', 'error');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name')?.toString().trim(),
      phone: formData.get('phone')?.toString().trim(),
      lineId: formData.get('lineId')?.toString().trim(),
      preference: formData.get('preference')?.toString().trim(),
      note: formData.get('note')?.toString().trim(),
      source: 'website-queue-form',
      createdAt: new Date().toISOString()
    };

    if (!payload.name || !payload.phone) {
      setStatus('請至少填寫姓名與電話。', 'error');
      return;
    }

    setStatus('送出中，請稍候…');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus('預約資料已送出，我們會盡快與你聯繫。', 'success');
      form.reset();
    } catch (error) {
      setStatus('送出失敗，請稍後再試或改用官方聯絡方式。', 'error');
      console.error(error);
    }
  });
})();
