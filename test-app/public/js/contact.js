document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const banner = document.getElementById('formBanner');

  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    message: document.getElementById('message').value.trim(),
  };

  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  banner.innerHTML = '<div class="banner banner-success">Message sent! We will be in touch shortly.</div>';
  document.getElementById('contactForm').reset();
});
