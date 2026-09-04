import { Router } from "express";
import { getAccount, updateAccount } from "../lib/store.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getAccount());
});

router.patch("/", (req, res) => {
  const { name } = req.body;
  if (!name || String(name).trim() === "") {
    return res.status(400).json({ error: "Name is required", details: null });
  }
  const account = updateAccount(req.body);
  res.json({ success: true, account });
});

export default router;
