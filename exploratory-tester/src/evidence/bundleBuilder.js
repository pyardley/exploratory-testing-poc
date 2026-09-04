import fs from "node:fs";
import path from "node:path";

export function slugForUrl(baseUrl, url) {
  const rel = url.replace(baseUrl, "").replace(/^\//, "") || "index.html";
  return rel.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export class EvidenceBundle {
  constructor(runDir) {
    this.runDir = runDir;
    this.pagesDir = path.join(runDir, "pages");
    fs.mkdirSync(this.pagesDir, { recursive: true });
  }

  pageDir(slug) {
    const dir = path.join(this.pagesDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  writeJson(relPath, data) {
    const full = path.join(this.runDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, JSON.stringify(data, null, 2), "utf-8");
    return full;
  }

  writePageFile(slug, fileName, content) {
    const dir = this.pageDir(slug);
    const full = path.join(dir, fileName);
    fs.writeFileSync(full, content);
    return full;
  }

  writePageJson(slug, fileName, data) {
    return this.writePageFile(slug, fileName, JSON.stringify(data, null, 2));
  }
}
