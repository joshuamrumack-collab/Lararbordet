// Bygger dist/index.html av src/: mall, CSS, JS-moduler (i nummerordning) och komprimerad data.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const r = (p) => readFileSync(join(root, p), "utf8");
const js = readdirSync(join(root, "src/js")).filter((f) => f.endsWith(".js")).sort()
  .map((f) => `/* ===== ${f} ===== */\n` + r("src/js/" + f)).join("\n");
const b64 = (p) => readFileSync(join(root, p)).toString("base64");
const data = [
  `<script type="application/gzip-base64" id="catalog-gz">${b64("data/catalog.json.gz")}</script>`,
  `<script type="application/gzip-base64" id="crit-gz">${b64("data/crit.json.gz")}</script>`,
  `<script type="application/gzip-base64" id="pdfjs-gz">${b64("data/pdfjs.min.mjs.gz")}</script>`,
  `<script type="application/gzip-base64" id="pdfjsw-gz">${b64("data/pdfjs.worker.min.mjs.gz")}</script>`,
  `<script>/* fflate 0.8.3 – MIT License, Copyright (c) 2026 Arjun Barrett */\n${r("src/vendor-fflate-0.8.3.min.js").replace(/<\/script/gi, "<\\/script")}</script>`,
].join("\n");
const version = JSON.parse(r("package.json")).version;
let out = r("src/template.html");
const put = (mark, val) => { if (!out.includes(mark)) throw new Error("saknar " + mark); out = out.split(mark).join(val); };
put("/*@@CSS@@*/", r("src/styles.css"));
put("<!--@@DATA@@-->", data);
put("/*@@JS@@*/", js.replace(/<\/script/gi, "<\\/script").replace("@@VERSION@@", version));
writeFileSync(join(root, "dist/index.html"), out);
console.log("dist/index.html", (Buffer.byteLength(out) / 1e6).toFixed(2), "MB");
