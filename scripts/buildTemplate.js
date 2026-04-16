/**
 * Build the Datamellon SOW template DOCX from the extracted XML parts.
 * Run: node scripts/buildTemplate.js
 */
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const templateDir = path.join(__dirname, "..", "template-extract");
const outputDir = path.join(__dirname, "..", "public", "templates");
const outputFile = path.join(outputDir, "Datamellon_SOW_Template.docx");

function addFilesToZip(zip, dirPath, zipPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      addFilesToZip(zip, fullPath, entryZipPath);
    } else {
      zip.file(entryZipPath, fs.readFileSync(fullPath));
    }
  }
}

const zip = new PizZip();
addFilesToZip(zip, templateDir, "");

fs.mkdirSync(outputDir, { recursive: true });
const content = zip.generate({
  type: "nodebuffer",
  mimeType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
});
fs.writeFileSync(outputFile, content);
console.log("Template DOCX created at:", outputFile);
