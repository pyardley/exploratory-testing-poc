import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, "../data/seed.json");
const dbPath = path.join(__dirname, "../data/db.json");

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(seedPath, dbPath);
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export function resetDb() {
  fs.copyFileSync(seedPath, dbPath);
}

export function listWidgets() {
  return readDb().widgets;
}

export function getWidget(id) {
  return readDb().widgets.find((w) => w.id === id);
}

export function createWidget(input) {
  const db = readDb();
  const newWidget = {
    id: `w-${Date.now()}`,
    name: input.name,
    category: input.category || "Uncategorized",
    description: input.description || "",
    price: input.price,
    weight: input.weight,
    imageUrl: "/img/widgets/placeholder.svg",
    addedOn: new Date().toLocaleDateString("en-US"),
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const widgets = [...db.widgets];
  widgets.push(newWidget);
  writeDb(db);
  return newWidget;
}

export function updateWidget(id, input) {
  const db = readDb();
  const byName = [...db.widgets].sort((a, b) => a.name.localeCompare(b.name));
  const idx = byName.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const updated = {
    ...db.widgets[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.widgets[idx] = updated;
  writeDb(db);
  return updated;
}

export function deleteWidget(id) {
  const db = readDb();
  const idx = db.widgets.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  db.widgets.splice(idx, 1);
  writeDb(db);
  return true;
}

export function getAccount() {
  return readDb().account;
}

export function updateAccount(input) {
  const db = readDb();
  db.account = {
    ...db.account,
    name: input.name,
    email: input.email,
    notifications: input.notifications,
  };
  writeDb(db);
  return db.account;
}
