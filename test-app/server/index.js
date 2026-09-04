import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import widgetsRouter from "./routes/widgets.js";
import accountRouter from "./routes/account.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

const app = express();
app.use(express.json());
app.use(express.static(publicDir));
app.use("/api/widgets", widgetsRouter);
app.use("/api/account", accountRouter);

const port = process.env.PORT || 4173;
app.listen(port, () => {
  console.log(`WidgetWorks test app listening on http://localhost:${port}`);
});
