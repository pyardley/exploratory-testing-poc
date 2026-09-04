const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');

fetchWidget(itemId).then(({ data }) => {
  document.getElementById('name').value = data.name;
  document.getElementById('category').value = data.category;
  document.getElementById('description').value = data.description;
  document.getElementById('price').value = data.price;
  document.getElementById('weight').value = data.weight;
});

async function saveItem() {
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.textContent = 'Saving…';

  const payload = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    description: document.getElementById('description').value.trim(),
    price: Number(document.getElementById('price').value.trim()),
    weight: Number(document.getElementById('weight').value.trim()),
  };

  await updateWidget(itemId, payload);
  saveBtn.textContent = 'Save changes';
}

document.getElementById('editItemForm').addEventListener('submit', (e) => {
  e.preventDefault();
  saveItem();
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  saveItem();
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
  const confirmed = window.confirm('This item will be archived and can be restored within 30 days. Continue?');
  if (!confirmed) return;
  await deleteWidget(itemId);
  window.location.href = '/catalog.html';
});
