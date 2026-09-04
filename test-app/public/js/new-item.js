document.getElementById('newItemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const banner = document.getElementById('formBanner');
  banner.innerHTML = '';

  const name = document.getElementById('name').value.trim();
  const priceRaw = document.getElementById('price').value.trim();
  const price = Number(priceRaw);

  if (!name || priceRaw === '' || Number.isNaN(price)) {
    banner.innerHTML = '<div class="banner banner-error">Something went wrong. Please check the form and try again.</div>';
    return;
  }

  const payload = {
    name,
    category: document.getElementById('category').value.trim(),
    description: document.getElementById('description').value.trim(),
    price,
    weight: Number(document.getElementById('weight').value.trim()) || 0,
  };

  const { ok } = await createWidget(payload);
  if (!ok) {
    banner.innerHTML = '<div class="banner banner-error">Something went wrong. Please check the form and try again.</div>';
    return;
  }
  window.location.href = '/catalog.html';
});
