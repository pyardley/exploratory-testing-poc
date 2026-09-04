const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');

fetchWidget(itemId).then(({ data }) => {
  document.getElementById('itemImage').src = data.imageUrl;
  document.getElementById('itemImage').alt = data.name;
  document.getElementById('itemName').textContent = data.name;
  document.getElementById('itemCategory').textContent = data.category;
  document.getElementById('itemAddedOn').textContent = `Added on ${data.addedOn}`;
  document.getElementById('itemPrice').textContent = `$${data.price.toFixed(3)}`;
  document.getElementById('itemDescription').textContent = data.description;
  document.getElementById('editLink').href = `/edit-item.html?id=${data.id}`;
});
