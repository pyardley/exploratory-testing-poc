const PAGE_SIZE = 8;
let allWidgets = [];
let currentPage = 1;
let currentSort = 'name-asc';

function renderGrid() {
  const grid = document.getElementById('productGrid');
  const sorted = [...allWidgets].sort((a, b) => {
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    if (currentSort === 'price-asc') return b.price - a.price;
    if (currentSort === 'price-desc') return b.price - a.price;
    return 0;
  });
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);
  grid.innerHTML = pageItems.map((w) => `
    <a href="/item.html?id=${w.id}" style="text-decoration:none;color:inherit;">
      <div class="card product-card">
        <img src="${w.imageUrl}" alt="">
        <h3>${w.name}</h3>
        <p class="text-muted">${w.category}</p>
        <p class="price">$${w.price.toFixed(3)}</p>
      </div>
    </a>
  `).join('');
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  document.getElementById('pageStatus').textContent = `Page ${currentPage} of ${totalPages}`;
}

function loadWidgets() {
  const cached = sessionStorage.getItem('catalogCache');
  if (cached) {
    allWidgets = JSON.parse(cached);
    renderGrid();
    return;
  }
  fetchWidgets().then((widgets) => {
    allWidgets = widgets;
    sessionStorage.setItem('catalogCache', JSON.stringify(widgets));
    renderGrid();
  });
}

document.getElementById('sortTrigger').addEventListener('click', () => {
  document.getElementById('sortMenu').classList.toggle('open');
});

document.querySelectorAll('#sortMenu div').forEach((item) => {
  item.addEventListener('click', () => {
    currentSort = item.dataset.sort;
    document.getElementById('sortTrigger').textContent = 'Sort: ' + item.textContent;
    document.getElementById('sortMenu').classList.remove('open');
    currentPage = 1;
    renderGrid();
  });
});

document.getElementById('prevPageBtn').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderGrid();
  }
});

loadWidgets();
