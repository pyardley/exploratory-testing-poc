async function fetchWidgets() {
  const res = await fetch('/api/widgets');
  return res.json();
}

async function fetchWidget(id) {
  const res = await fetch(`/api/widgets/${id}`);
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}

async function createWidget(payload) {
  const res = await fetch('/api/widgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}

async function updateWidget(id, payload) {
  const res = await fetch(`/api/widgets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}

async function deleteWidget(id) {
  const res = await fetch(`/api/widgets/${id}`, { method: 'DELETE' });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}
