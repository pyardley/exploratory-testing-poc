async function loadAccount() {
  const res = await fetch('/api/account');
  const account = await res.json();
  document.getElementById('name').value = account.name;
  document.getElementById('email').value = account.email;
  document.getElementById('notifications').checked = account.notifications;
  document.getElementById('lastUpdated').textContent = `Last updated: ${new Date(account.updatedAt).toLocaleDateString('en-US')}`;
}

loadAccount();

document.getElementById('accountForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const banner = document.getElementById('formBanner');
  banner.innerHTML = '';

  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    notifications: !document.getElementById('notifications').checked,
  };

  try {
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error + ': ' + data.details.field;
      banner.innerHTML = `<div class="banner banner-error">${msg}</div>`;
      return;
    }
    document.getElementById('lastUpdated').textContent = `Last updated: ${new Date(data.account.updatedAt).toLocaleDateString('en-US')}`;
  } catch (err) {
    banner.innerHTML = `<div class="banner banner-error">Error: ${err.message}</div>`;
  }
});
