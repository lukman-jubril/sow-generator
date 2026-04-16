"use client";

import PizZip from "pizzip";
import { saveAs } from "file-saver";

/* ================================================================
   templateExport.ts – Export editor HTML into the Datamellon DOCX
   template, preserving styles, footer, numbering, theme, media,
   images, and inline formatting.
   ================================================================ */

// ── Constants ──────────────────────────────────────────────────
const PX_TO_EMU = 9525; // 1 px ≈ 9525 EMU at 96 DPI
const MAX_IMG_WIDTH_EMU = 5486400; // 6 inches
const IMAGE_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";

// ── XML helpers ────────────────────────────────────────────────

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Image types ────────────────────────────────────────────────

interface ImageEntry {
  rId: string;
  fileName: string;
  data: Uint8Array;
  contentType: string;
  widthEmu: number;
  heightEmu: number;
  docPrId: number;
}

/** Decode a data-URL to binary + mime. */
function dataUrlToBinary(dataUrl: string): {
  data: Uint8Array;
  mime: string;
} | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const binary = atob(match[2]);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return { data, mime };
}

/** Load an image to read its natural dimensions. */
function loadImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 600, height: 400 });
    img.src = src;
  });
}

/** Resolve image binary + dimensions. Works for data: and blob:/http: URLs. */
async function resolveImage(src: string): Promise<{
  data: Uint8Array;
  mime: string;
  width: number;
  height: number;
} | null> {
  try {
    let data: Uint8Array;
    let mime: string;

    if (src.startsWith("data:")) {
      const parsed = dataUrlToBinary(src);
      if (!parsed) return null;
      data = parsed.data;
      mime = parsed.mime;
    } else {
      const response = await fetch(src);
      if (!response.ok) return null;
      mime = response.headers.get("content-type") || "image/png";
      data = new Uint8Array(await response.arrayBuffer());
    }

    const dims = await loadImageDimensions(src);
    return { data, mime, width: dims.width, height: dims.height };
  } catch {
    return null;
  }
}

function extFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpeg";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("svg")) return "svg";
  return "png";
}

/** Build an OOXML <w:drawing> inline image reference. */
function buildDrawingXml(img: ImageEntry): string {
  return (
    `<w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${img.widthEmu}" cy="${img.heightEmu}"/>` +
    `<wp:docPr id="${img.docPrId}" name="image${img.docPrId}"/>` +
    `<a:graphic>` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic>` +
    `<pic:nvPicPr>` +
    `<pic:cNvPr id="${img.docPrId}" name="image${img.docPrId}"/>` +
    `<pic:cNvPicPr/>` +
    `</pic:nvPicPr>` +
    `<pic:blipFill>` +
    `<a:blip r:embed="${img.rId}"/>` +
    `<a:stretch><a:fillRect/></a:stretch>` +
    `</pic:blipFill>` +
    `<pic:spPr>` +
    `<a:xfrm>` +
    `<a:off x="0" y="0"/>` +
    `<a:ext cx="${img.widthEmu}" cy="${img.heightEmu}"/>` +
    `</a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
    `</pic:spPr>` +
    `</pic:pic>` +
    `</a:graphicData>` +
    `</a:graphic>` +
    `</wp:inline>` +
    `</w:drawing>`
  );
}

// ── Pre-process images ─────────────────────────────────────────

/**
 * Scan the parsed HTML container for all <img> elements, resolve their
 * binary data and dimensions, and return a map keyed by src.
 */
async function collectAllImages(
  container: HTMLElement,
  startRId: number,
  startDocPrId: number,
): Promise<Map<string, ImageEntry>> {
  const imgEls = container.querySelectorAll("img");
  const imgMap = new Map<string, ImageEntry>();
  let rIdCounter = startRId;
  let docPrCounter = startDocPrId;

  for (const imgEl of Array.from(imgEls)) {
    const src = imgEl.getAttribute("src") || "";
    if (!src || imgMap.has(src)) continue;

    const resolved = await resolveImage(src);
    if (!resolved) continue;

    const ext = extFromMime(resolved.mime);
    const fileName = `image${rIdCounter}.${ext}`;
    const rId = `rId${rIdCounter}`;

    // Parse explicit dimensions from style/attributes
    let widthPx = 0;
    let heightPx = 0;

    const styleAttr = imgEl.getAttribute("style") || "";
    const wMatch = styleAttr.match(/(?:^|;\s*)width:\s*([\d.]+)px/);
    const hMatch = styleAttr.match(/(?:^|;\s*)height:\s*([\d.]+)px/);
    if (wMatch) widthPx = parseFloat(wMatch[1]);
    if (hMatch) heightPx = parseFloat(hMatch[1]);

    // Fall back to HTML attributes
    if (!widthPx && imgEl.getAttribute("width"))
      widthPx = parseFloat(imgEl.getAttribute("width")!);
    if (!heightPx && imgEl.getAttribute("height"))
      heightPx = parseFloat(imgEl.getAttribute("height")!);

    // Fall back to natural dimensions
    if (!widthPx) widthPx = resolved.width;
    if (!heightPx) heightPx = resolved.height;

    // Convert to EMU and cap at max width
    let widthEmu = Math.round(widthPx * PX_TO_EMU);
    let heightEmu = Math.round(heightPx * PX_TO_EMU);

    if (widthEmu > MAX_IMG_WIDTH_EMU) {
      const ratio = MAX_IMG_WIDTH_EMU / widthEmu;
      widthEmu = MAX_IMG_WIDTH_EMU;
      heightEmu = Math.round(heightEmu * ratio);
    }

    imgMap.set(src, {
      rId,
      fileName,
      data: resolved.data,
      contentType: resolved.mime,
      widthEmu,
      heightEmu,
      docPrId: docPrCounter,
    });

    rIdCounter++;
    docPrCounter++;
  }

  return imgMap;
}

// ── Run-level (inline) conversion ──────────────────────────────

interface RunProps {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  highlight?: string;
  color?: string; // hex like "FF0000"
  fontSize?: number; // half-points (Word units, e.g. 24 = 12pt)
  bgColor?: string; // hex fill
}

interface RunItem {
  text: string;
  props: RunProps;
  isBreak?: boolean;
  drawingXml?: string; // for inline images
}

/** Parse CSS color value to 6-hex-digit string (or null). */
function cssColorToHex(colorStr: string): string | null {
  if (!colorStr) return null;

  // Already hex
  const hexMatch = colorStr.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return hex.substring(0, 6).toUpperCase();
  }

  // rgb(r,g,b)
  const rgbMatch = colorStr.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return (r + g + b).toUpperCase();
  }

  return null;
}

/** Parse font size string to half-points. */
function parseFontSizeToHalfPts(sizeStr: string): number | null {
  if (!sizeStr) return null;

  // "12pt", "12.5pt"
  const ptMatch = sizeStr.match(/([\d.]+)\s*pt/i);
  if (ptMatch) return Math.round(parseFloat(ptMatch[1]) * 2);

  // "16px" → convert to pt (1pt ≈ 1.333px)
  const pxMatch = sizeStr.match(/([\d.]+)\s*px/i);
  if (pxMatch) return Math.round((parseFloat(pxMatch[1]) / 1.333) * 2);

  // execCommand fontSize uses 1-7 scale
  const num = parseInt(sizeStr);
  if (num >= 1 && num <= 7) {
    const ptMap: Record<number, number> = {
      1: 8,
      2: 10,
      3: 12,
      4: 14,
      5: 18,
      6: 24,
      7: 36,
    };
    return (ptMap[num] || 12) * 2;
  }

  return null;
}

/** Extract RunProps from an element's inline style + tag. */
function propsFromElement(el: HTMLElement, inherited: RunProps): RunProps {
  const next: RunProps = { ...inherited };
  const tag = el.tagName.toLowerCase();

  // Tag-based
  if (tag === "strong" || tag === "b") next.bold = true;
  if (tag === "em" || tag === "i") next.italic = true;
  if (tag === "u") next.underline = true;
  if (tag === "s" || tag === "del" || tag === "strike") next.strike = true;
  if (tag === "mark") next.highlight = "yellow";

  // Style-based
  const style = el.getAttribute("style") || "";
  if (style) {
    if (/font-weight\s*:\s*(bold|[7-9]\d\d)/i.test(style)) next.bold = true;
    if (/font-style\s*:\s*italic/i.test(style)) next.italic = true;
    if (/text-decoration[^:]*:\s*[^;]*underline/i.test(style))
      next.underline = true;
    if (/text-decoration[^:]*:\s*[^;]*line-through/i.test(style))
      next.strike = true;

    const colorMatch = style.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
    if (colorMatch) {
      const hex = cssColorToHex(colorMatch[1].trim());
      if (hex && hex !== "000000") next.color = hex;
    }

    const bgMatch = style.match(/background(?:-color)?\s*:\s*([^;]+)/i);
    if (bgMatch) {
      const hex = cssColorToHex(bgMatch[1].trim());
      if (hex) next.bgColor = hex;
    }

    const fsMatch = style.match(/font-size\s*:\s*([^;]+)/i);
    if (fsMatch) {
      const hp = parseFontSizeToHalfPts(fsMatch[1].trim());
      if (hp) next.fontSize = hp;
    }
  }

  // <font> tags from execCommand
  if (tag === "font") {
    const color = el.getAttribute("color");
    if (color) {
      const hex = cssColorToHex(color);
      if (hex) next.color = hex;
    }
    const size = el.getAttribute("size");
    if (size) {
      const hp = parseFontSizeToHalfPts(size);
      if (hp) next.fontSize = hp;
    }
  }

  return next;
}

/**
 * Recursively walk inline nodes and collect flat runs with
 * accumulated formatting + image drawing XML.
 */
function collectRuns(
  node: Node,
  inherited: RunProps,
  runs: RunItem[],
  imgMap: Map<string, ImageEntry>,
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (text) {
      runs.push({ text, props: { ...inherited } });
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (["style", "script", "meta", "link"].includes(tag)) return;

  if (tag === "br") {
    runs.push({ text: "", props: inherited, isBreak: true });
    return;
  }

  // Handle inline images
  if (tag === "img") {
    const src = el.getAttribute("src") || "";
    const entry = imgMap.get(src);
    if (entry) {
      runs.push({
        text: "",
        props: inherited,
        drawingXml: buildDrawingXml(entry),
      });
    }
    return;
  }

  const next = propsFromElement(el, inherited);
  el.childNodes.forEach((child) => collectRuns(child, next, runs, imgMap));
}

/** Serialize an array of RunItem into OOXML <w:r> elements. */
function runsToOoxml(runs: RunItem[]): string {
  return runs
    .map((run) => {
      if (run.isBreak) {
        return "<w:r><w:br/></w:r>";
      }
      if (run.drawingXml) {
        return `<w:r><w:rPr/>${run.drawingXml}</w:r>`;
      }
      const parts: string[] = [];
      if (run.props.bold) parts.push('<w:b w:val="1"/><w:bCs w:val="1"/>');
      if (run.props.italic) parts.push('<w:i w:val="1"/><w:iCs w:val="1"/>');
      if (run.props.underline) parts.push('<w:u w:val="single"/>');
      if (run.props.strike) parts.push('<w:strike w:val="1"/>');
      if (run.props.highlight)
        parts.push(`<w:highlight w:val="${run.props.highlight}"/>`);
      if (run.props.color) parts.push(`<w:color w:val="${run.props.color}"/>`);
      if (run.props.fontSize)
        parts.push(
          `<w:sz w:val="${run.props.fontSize}"/><w:szCs w:val="${run.props.fontSize}"/>`,
        );
      if (run.props.bgColor)
        parts.push(
          `<w:shd w:val="clear" w:color="auto" w:fill="${run.props.bgColor}"/>`,
        );

      const rPr = parts.length > 0 ? `<w:rPr>${parts.join("")}</w:rPr>` : "";
      return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(run.text)}</w:t></w:r>`;
    })
    .join("");
}

/** Collect inline content from an element and return OOXML runs. */
function inlineToOoxml(
  el: HTMLElement,
  imgMap: Map<string, ImageEntry>,
): string {
  const runs: RunItem[] = [];
  collectRuns(el, {}, runs, imgMap);
  return runsToOoxml(runs);
}

// ── Heading detection ──────────────────────────────────────────

function detectHeadingLevel(el: HTMLElement): number | null {
  const tag = el.tagName.toLowerCase();
  if (tag >= "h1" && tag <= "h6") return parseInt(tag[1]);

  const cls = el.className || "";
  for (let i = 1; i <= 6; i++) {
    if (new RegExp(`\\bHeading${i}\\b`, "i").test(cls)) return i;
  }
  return null;
}

// ── Paragraph alignment detection ──────────────────────────────

function detectAlignment(
  el: HTMLElement,
): "left" | "center" | "right" | "both" | null {
  const style = el.getAttribute("style") || "";
  const match = style.match(/text-align\s*:\s*(\w+)/i);
  if (match) {
    const val = match[1].toLowerCase();
    if (val === "center") return "center";
    if (val === "right") return "right";
    if (val === "justify") return "both";
    if (val === "left") return "left";
  }

  const align = el.getAttribute("align");
  if (align) {
    const val = align.toLowerCase();
    if (val === "center") return "center";
    if (val === "right") return "right";
    if (val === "justify") return "both";
  }

  return null;
}

function alignmentXml(
  align: "left" | "center" | "right" | "both" | null,
): string {
  if (!align || align === "left") return "";
  return `<w:jc w:val="${align}"/>`;
}

// ── Block-level conversion ─────────────────────────────────────

function htmlToOoxmlBody(
  html: string,
  imgMap: Map<string, ImageEntry>,
): string {
  const cleaned = html
    .replace(/<div[^>]*class=["']?sow-cover["']?[^>]*>[\s\S]*?<\/div>\s*/i, "")
    .trim();

  const container = document.createElement("div");
  container.innerHTML = cleaned;

  const paragraphs: string[] = [];

  const bulletNumId = "1";
  const decimalNumId = "4";

  function processElement(node: Node, depth?: number): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(
          `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`,
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (["style", "script", "meta", "link"].includes(tag)) return;

    // ── Heading ──
    const hLevel = detectHeadingLevel(el);
    if (hLevel !== null && hLevel >= 1 && hLevel <= 6) {
      const styleId = `Heading${hLevel}`;
      const runs = inlineToOoxml(el, imgMap);
      const align = alignmentXml(detectAlignment(el));
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="${styleId}"/>${align}</w:pPr>${runs}</w:p>`,
      );
      return;
    }

    switch (tag) {
      case "p": {
        const runs = inlineToOoxml(el, imgMap);
        const align = alignmentXml(detectAlignment(el));
        if (runs) {
          const pPr = align ? `<w:pPr>${align}</w:pPr>` : "";
          paragraphs.push(`<w:p>${pPr}${runs}</w:p>`);
        } else {
          paragraphs.push("<w:p/>");
        }
        break;
      }

      case "ul":
        processListItems(el, bulletNumId, depth || 0);
        break;

      case "ol":
        processListItems(el, decimalNumId, depth || 0);
        break;

      case "li": {
        // Standalone li (shouldn't normally happen, but handle gracefully)
        const runs = inlineToOoxml(el, imgMap);
        paragraphs.push(`<w:p>${runs}</w:p>`);
        break;
      }

      case "table":
        processTable(el);
        break;

      case "br":
        paragraphs.push("<w:p/>");
        break;

      case "img": {
        const src = el.getAttribute("src") || "";
        const entry = imgMap.get(src);
        if (entry) {
          paragraphs.push(
            `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr/>${buildDrawingXml(entry)}</w:r></w:p>`,
          );
        }
        break;
      }

      case "div":
      case "section":
      case "article":
      case "main":
      case "header":
      case "footer":
      case "nav":
      case "aside":
      case "figure":
      case "figcaption":
      case "details":
      case "summary":
      case "blockquote": {
        // Check if this div/container has alignment etc
        const containerAlign = detectAlignment(el);
        if (
          containerAlign &&
          !el.querySelector(
            "p, div, h1, h2, h3, h4, h5, h6, ul, ol, table, section",
          )
        ) {
          // Simple content container with alignment — treat as a paragraph
          const runs = inlineToOoxml(el, imgMap);
          if (runs) {
            paragraphs.push(
              `<w:p><w:pPr>${alignmentXml(containerAlign)}</w:pPr>${runs}</w:p>`,
            );
            break;
          }
        }
        el.childNodes.forEach((child) => processElement(child));
        break;
      }

      case "a": {
        // Hyperlinks — fall through to inline content with text
        const runs = inlineToOoxml(el, imgMap);
        if (runs) {
          paragraphs.push(`<w:p>${runs}</w:p>`);
        }
        break;
      }

      default: {
        const hasBlock = el.querySelector(
          "p, div, h1, h2, h3, h4, h5, h6, ul, ol, table, section, article, blockquote",
        );
        if (hasBlock) {
          el.childNodes.forEach((child) => processElement(child));
        } else {
          const runs = inlineToOoxml(el, imgMap);
          if (runs) {
            const align = alignmentXml(detectAlignment(el));
            const pPr = align ? `<w:pPr>${align}</w:pPr>` : "";
            paragraphs.push(`<w:p>${pPr}${runs}</w:p>`);
          }
        }
        break;
      }
    }
  }

  function processListItems(
    listEl: HTMLElement,
    numId: string,
    ilvl: number,
  ): void {
    for (const child of Array.from(listEl.children)) {
      const childTag = child.tagName.toLowerCase();

      if (childTag === "li") {
        // Collect only direct inline/text content (not nested sub-lists)
        const inlineRuns: RunItem[] = [];
        let hasNestedList = false;

        for (const liChild of Array.from(child.childNodes)) {
          if (liChild.nodeType === Node.ELEMENT_NODE) {
            const liChildTag = (liChild as HTMLElement).tagName.toLowerCase();
            if (liChildTag === "ul" || liChildTag === "ol") {
              hasNestedList = true;
              continue;
            }
          }
          collectRuns(liChild, {}, inlineRuns, imgMap);
        }

        const runsXml = runsToOoxml(inlineRuns);
        paragraphs.push(
          `<w:p><w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr></w:pPr>${runsXml}</w:p>`,
        );

        // Process nested sub-lists
        if (hasNestedList) {
          for (const liChild of Array.from(child.children)) {
            const liChildTag = liChild.tagName.toLowerCase();
            if (liChildTag === "ul") {
              processListItems(liChild as HTMLElement, "1", ilvl + 1);
            } else if (liChildTag === "ol") {
              processListItems(liChild as HTMLElement, "4", ilvl + 1);
            }
          }
        }
      } else if (childTag === "ul" || childTag === "ol") {
        // Direct nested list without wrapping <li>
        processListItems(
          child as HTMLElement,
          childTag === "ul" ? "1" : "4",
          ilvl + 1,
        );
      }
    }
  }

  function processTable(tableEl: HTMLElement): void {
    const rowEls = tableEl.querySelectorAll("tr");
    if (rowEls.length === 0) return;

    const rows: string[] = [];
    rowEls.forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("td, th").forEach((cell) => {
        const isHeader = cell.tagName.toLowerCase() === "th";
        const runs = inlineToOoxml(cell as HTMLElement, imgMap);
        const shading = isHeader
          ? '<w:shd w:val="clear" w:fill="e2efd9"/>'
          : "";

        cells.push(
          `<w:tc><w:tcPr><w:tcBorders>` +
            `<w:top w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
            `<w:bottom w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
            `<w:left w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
            `<w:right w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
            `</w:tcBorders>${shading}<w:tcMar>` +
            `<w:top w:w="40" w:type="dxa"/><w:left w:w="40" w:type="dxa"/>` +
            `<w:bottom w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/>` +
            `</w:tcMar></w:tcPr>` +
            `<w:p>${runs}</w:p></w:tc>`,
        );
      });

      if (cells.length > 0) {
        rows.push(`<w:tr>${cells.join("")}</w:tr>`);
      }
    });

    if (rows.length > 0) {
      paragraphs.push(
        `<w:tbl><w:tblPr>` +
          `<w:tblW w:w="0" w:type="auto"/>` +
          `<w:tblBorders>` +
          `<w:top w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
          `<w:bottom w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
          `<w:left w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
          `<w:right w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
          `<w:insideH w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
          `<w:insideV w:val="single" w:sz="4" w:space="0" w:color="434343"/>` +
          `</w:tblBorders></w:tblPr>${rows.join("")}</w:tbl>`,
      );
      paragraphs.push("<w:p/>");
    }
  }

  container.childNodes.forEach((child) => processElement(child));

  return paragraphs.join("\n");
}

// ── document.xml surgery ───────────────────────────────────────

function replaceDocumentBody(docXml: string, newBodyContent: string): string {
  const bodyOpenIdx = docXml.indexOf("<w:body>");
  if (bodyOpenIdx === -1) throw new Error("document.xml has no <w:body>");
  const bodyContentStart = bodyOpenIdx + "<w:body>".length;

  const sectPrIdx = docXml.lastIndexOf("<w:sectPr");
  if (sectPrIdx === -1) throw new Error("document.xml has no <w:sectPr>");

  const preamble = docXml.substring(0, bodyContentStart);
  const sectPrAndRest = docXml.substring(sectPrIdx);

  return preamble + "\n" + newBodyContent + "\n" + sectPrAndRest;
}

/**
 * Make sure the document.xml root element has the `pic:` namespace declaration.
 * Some templates might omit it if no pictures were originally in the body.
 */
function ensurePicNamespace(docXml: string): string {
  if (docXml.includes("xmlns:pic=")) return docXml;

  // Insert before the closing > of the <w:document ...> tag
  const docTagEnd = docXml.indexOf(">", docXml.indexOf("<w:document"));
  if (docTagEnd === -1) return docXml;

  return (
    docXml.substring(0, docTagEnd) +
    ' xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"' +
    docXml.substring(docTagEnd)
  );
}

// ── Zip helpers ────────────────────────────────────────────────

/** Find the highest existing rId number in document.xml.rels. */
function getMaxRId(relsXml: string): number {
  let max = 0;
  const re = /rId(\d+)/g;
  let m;
  while ((m = re.exec(relsXml)) !== null) {
    const n = parseInt(m[1]);
    if (n > max) max = n;
  }
  return max;
}

/** Find highest docPr id in document.xml. */
function getMaxDocPrId(docXml: string): number {
  let max = 0;
  const re = /<wp:docPr\s+id="(\d+)"/g;
  let m;
  while ((m = re.exec(docXml)) !== null) {
    const n = parseInt(m[1]);
    if (n > max) max = n;
  }
  // Also check pic:cNvPr
  const re2 = /<pic:cNvPr\s+id="(\d+)"/g;
  while ((m = re2.exec(docXml)) !== null) {
    const n = parseInt(m[1]);
    if (n > max) max = n;
  }
  return max;
}

/** Add image relationships to document.xml.rels. */
function addImageRelationships(zip: PizZip, images: ImageEntry[]): void {
  if (images.length === 0) return;

  const relsPath = "word/_rels/document.xml.rels";
  let relsXml =
    zip.file(relsPath)?.asText() ||
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

  const closingTag = "</Relationships>";
  const insertPoint = relsXml.lastIndexOf(closingTag);

  let newRels = "";
  for (const img of images) {
    newRels += `<Relationship Id="${img.rId}" Type="${IMAGE_NS}" Target="media/${img.fileName}"/>`;
  }

  relsXml = relsXml.substring(0, insertPoint) + newRels + closingTag;
  zip.file(relsPath, relsXml);
}

/** Ensure Content_Types.xml has entries for image extensions used. */
function ensureContentTypes(zip: PizZip, images: ImageEntry[]): void {
  if (images.length === 0) return;

  const ctPath = "[Content_Types].xml";
  let ctXml = zip.file(ctPath)?.asText() || "";
  if (!ctXml) return;

  const extensions = new Set(images.map((img) => extFromMime(img.contentType)));

  for (const ext of extensions) {
    if (ctXml.includes(`Extension="${ext}"`)) continue;
    const mime =
      ext === "jpeg"
        ? "image/jpeg"
        : ext === "gif"
          ? "image/gif"
          : ext === "webp"
            ? "image/webp"
            : "image/png";
    const insertPoint = ctXml.lastIndexOf("</Types>");
    ctXml =
      ctXml.substring(0, insertPoint) +
      `<Default ContentType="${mime}" Extension="${ext}"/>` +
      "</Types>";
  }

  zip.file(ctPath, ctXml);
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Extract metadata (client name, title) from editable HTML.
 */
export function extractMetadataFromHtml(html: string): {
  clientName: string;
  projectTitle: string;
  projectMonth: string;
} {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");

  let clientName = "Client Name";
  let projectTitle = "Project Title";
  const projectMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const h1 = dom.querySelector("h1");
  if (h1?.textContent) {
    const match = h1.textContent.match(/Datamellon\s*[-–]\s*(.+)/);
    if (match) clientName = match[1].trim();
  }

  const h2s = dom.querySelectorAll("h2");
  for (const h2 of Array.from(h2s)) {
    const t = h2.textContent?.trim();
    if (t && !t.includes("Datamellon") && t.length > 2) {
      projectTitle = t;
      break;
    }
  }

  return { clientName, projectTitle, projectMonth };
}

/**
 * Extract the Datamellon logo from a DOCX template as a data-URL.
 */
export async function extractLogoDataUrlFromTemplate(
  templatePath: string,
): Promise<string | null> {
  try {
    const templateUrl =
      templatePath.startsWith("/") || templatePath.startsWith("http")
        ? templatePath
        : `/${templatePath}`;

    const response = await fetch(templateUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const mediaFolder = "word/media/";
    const mediaFiles = Object.keys(zip.files).filter((p) =>
      p.startsWith(mediaFolder),
    );
    if (mediaFiles.length === 0) return null;

    const firstMedia = zip.files[mediaFiles[0]];
    const uint8 = firstMedia.asUint8Array();
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 =
      typeof window === "undefined"
        ? Buffer.from(binary, "binary").toString("base64")
        : btoa(binary);

    const ext = mediaFiles[0].split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : "application/octet-stream";
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.warn("Failed to extract media from template", e);
    return null;
  }
}

/**
 * Export the editor's HTML content to a DOCX that preserves the Datamellon
 * template's styles, footer, numbering, theme and media — including any
 * images the user inserted in the editor and all inline formatting.
 */
export async function exportToWordFromTemplate(
  html: string,
  templatePath: string,
  filename: string = `Datamellon_SOW_${new Date().toISOString().slice(0, 10)}.docx`,
  originalDocxBuffer?: ArrayBuffer,
): Promise<void> {
  try {
    // 1. Load the base DOCX zip
    let zipData: ArrayBuffer;
    if (originalDocxBuffer) {
      zipData = originalDocxBuffer;
    } else {
      const url =
        templatePath.startsWith("/") || templatePath.startsWith("http")
          ? templatePath
          : `/${templatePath}`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch template: ${response.status}`);
      zipData = await response.arrayBuffer();
    }

    const zip = new PizZip(zipData);
    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) throw new Error("Template DOCX has no word/document.xml");
    let docXml = docXmlFile.asText();

    // 2. Determine ID counters from existing content
    const relsXml = zip.file("word/_rels/document.xml.rels")?.asText() || "";
    const startRId = getMaxRId(relsXml) + 1;
    const startDocPrId = getMaxDocPrId(docXml) + 1;

    // 3. Pre-process: parse HTML and resolve all images (async)
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = html;
    const imgMap = await collectAllImages(
      tempContainer,
      startRId,
      startDocPrId,
    );

    // 4. Convert HTML to OOXML body paragraphs (sync, uses imgMap)
    const bodyContent = htmlToOoxmlBody(html, imgMap);

    // 5. Splice new body into document.xml
    docXml = ensurePicNamespace(docXml);
    const newDocXml = replaceDocumentBody(docXml, bodyContent);
    zip.file("word/document.xml", newDocXml);

    // 6. Add images to the zip
    const images = Array.from(imgMap.values());
    for (const img of images) {
      zip.file(`word/media/${img.fileName}`, img.data);
    }

    // 7. Update relationships and content types
    addImageRelationships(zip, images);
    ensureContentTypes(zip, images);

    // 8. Generate and download
    const blob = zip.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(blob, filename);
  } catch (error) {
    console.error("Template-based DOCX export error:", error);
    throw error;
  }
}
