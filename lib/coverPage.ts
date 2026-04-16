import { extractMetadataFromHtml } from "./templateExport";

export interface CoverPageData {
  coverHtml: string;
  contentHtml: string;
}

export function extractCoverPageFromHtml(htmlContent: string): CoverPageData {
  // Find the cover page div
  const coverRegex =
    /<div[^>]*class="?sow-cover"?[^>]*>[\s\S]*?<\/div>\s*(?=<div[^>]*style=.*page-break|<h1|<h2|<p|$)/i;
  const match = htmlContent.match(coverRegex);

  if (match && match[0]) {
    const coverHtml = match[0];
    // Remove the cover page div from content
    const contentHtml = htmlContent.replace(coverRegex, "").trim();
    return { coverHtml, contentHtml };
  }

  // If no cover page found, generate one
  return {
    coverHtml: generateCoverHtml("", "", ""), // Generate basic cover
    contentHtml: htmlContent,
  };
}

export function generateCoverHtml(
  htmlContent: string,
  templateLogoDataUrl?: string,
  clientLogoDataUrl?: string,
) {
  const { clientName, projectTitle } = extractMetadataFromHtml(
    htmlContent || "<h1>Statement of Work</h1>",
  );
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build cover HTML with professional styling
  const templateLogoImg = templateLogoDataUrl
    ? `<img src="${templateLogoDataUrl}" alt="Datamellon" style="max-width:160px; max-height:90px; object-fit:contain;" />`
    : `<div style="width:160px;height:90px;background:#ECFDF5;color:#065F46;display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:8px;font-size:14px;">Datamellon</div>`;

  const clientLogoImg = clientLogoDataUrl
    ? `<img src="${clientLogoDataUrl}" alt="Client" style="max-width:140px; max-height:100px; object-fit:contain;" />`
    : "";

  const coverHtml = `
  <div class="sow-cover" style="page-break-after:always;width:100%;min-height:100vh;display:flex;flex-direction:column;padding:60px;box-sizing:border-box;background:#FFFFFF;">
    <!-- Header with logos -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:80px;">
      <div style="flex:0 0 auto;">${templateLogoImg}</div>
      ${clientLogoImg ? `<div style="flex:0 0 auto;text-align:right;">${clientLogoImg}</div>` : ""}
    </div>

    <!-- Center content -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <h1 style="font-size:42px;font-weight:700;color:#0F172A;margin:0 0 24px 0;line-height:1.2;">${escapeHtml(
        projectTitle,
      )}</h1>
      <p style="font-size:20px;color:#374151;margin:0 0 16px 0;font-weight:500;">Datamellon - ${escapeHtml(
        clientName,
      )}</p>
      <p style="font-size:16px;color:#6B7280;margin:0;letter-spacing:0.5px;">${dateStr}</p>
    </div>

    <!-- Footer -->
    <div style="margin-top:80px;border-top:1px solid #E5E7EB;padding-top:24px;text-align:center;">
      <p style="font-size:12px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Datamellon Limited. All rights reserved.</p>
    </div>
  </div>
  `;

  return coverHtml + htmlContent;
}

function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
