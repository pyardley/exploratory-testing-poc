import { Router } from "express";
import { listWidgets, getWidget, createWidget, updateWidget, deleteWidget } from "../lib/store.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(listWidgets());
});

router.get("/:id", (req, res) => {
  const widget = getWidget(req.params.id);
  if (!widget) {
    return res.status(404).json({ error: "Widget not found" });
  }
  const notesPreview = widget.notes.trim();
  res.json({ ...widget, notesPreview });
});

router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name || String(name).trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }
  const widget = createWidget(req.body);
  res.json({ success: true, id: widget.id, widget });
});

router.patch("/:id", (req, res) => {
  const updated = updateWidget(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Widget not found" });
  }
  res.json({ success: true, widget: updated });
});

router.delete("/:id", (req, res) => {
  const removed = deleteWidget(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: "Widget not found" });
  }
  res.json({ success: true });
});

export default router;
