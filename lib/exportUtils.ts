'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Footer,
  ImageRun,
  PageBreak,
  TableOfContents,
  BorderStyle,
  ShadingType,
  PageNumber,
  LevelFormat,
  ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';

/* ===============================
   CONSTANTS / BRANDING - EXACT TEMPLATE MATCH
================================ */

const DATAMELLON_FOOTER = {
  line1: 'DATAMELLON LIMITED | T: +442039954988, +23416331141, +23416331142,  +2348147728469 | W: https://datamellon.com | E: connect@datamellon.com',
  line2: 'London Office: Epworth House, 25 City Rd, Shoreditch, London EC1Y 1AA, United Kingdom | Lagos Office: NIJ House, Plot 20, Adeyemo Alakija Street, Victoria Island, Lagos, Nigeria',
};

// DXA units: 1440 = 1 inch
const PAGE = {
  width: 12240, // 8.5"
  height: 15840, // 11"
  margin: { top: 1440, right: 1440, bottom: 1800, left: 1440 }, // 1" margins, extra bottom for footer
};

/* ===============================
   PDF EXPORT - TEMPLATE FORMAT
================================ */

export const exportToPDF = (html: string, logoBase64: string, filename = 'Datamellon_SOW.pdf') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 40;
  let y = margin;

  // === COVER PAGE ===
  
  // Logo (if provided)
  if (logoBase64) {
    try {
      const base64Data = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
      const cleanBase64 = base64Data.replace(/\s/g, '');
      doc.addImage(`data:image/png;base64,${cleanBase64}`, 'PNG', margin, y, 136, 22);
    } catch (error) {
      console.warn('Logo error:', error);
    }
  }

  // Spacing after logo
  y = pageHeight / 2 - 60;

  // Title: "Datamellon - [Client Name]"
  doc.setFontSize(27);
  doc.setFont('helvetica', 'normal');
  const titleText = 'Datamellon - Client Name'; // Parse from HTML or use default
  doc.text(titleText, pageWidth / 2, y, { align: 'center' });

  // Date: "[Month Year]"
  y += 40;
  doc.setFontSize(27);
  const dateText = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  doc.text(dateText, pageWidth / 2, y, { align: 'center' });

  // Footer on cover page
  addPDFFooter(doc, 1);

  // === NEW PAGE FOR CONTENT ===
  doc.addPage();
  y = margin;

  // Parse HTML content
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');

  let pageNum = 2;

  dom.body.childNodes.forEach((node: any) => {
    // Check page overflow
    if (y > pageHeight - 120) {
      addPDFFooter(doc, pageNum);
      doc.addPage();
      y = margin;
      pageNum++;
    }

    if (node.tagName === 'H1') {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(node.textContent || '', margin, y);
      y += 20;
    } else if (node.tagName === 'H2') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(node.textContent || '', margin, y);
      y += 16;
    } else if (node.tagName === 'H3') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(node.textContent || '', margin, y);
      y += 14;
    } else if (node.tagName === 'P') {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(node.textContent || '', pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 6;
    } else if (node.tagName === 'TABLE') {
      const tableData: any[] = [];
      const headers: string[] = [];
      
      // Extract headers
      const headerRow = node.querySelector('thead tr');
      if (headerRow) {
        headerRow.querySelectorAll('th').forEach((th: any) => {
          headers.push(th.textContent || '');
        });
      }

      // Extract rows
      node.querySelectorAll('tbody tr').forEach((tr: any) => {
        const row: string[] = [];
        tr.querySelectorAll('td').forEach((td: any) => {
          row.push(td.textContent || '');
        });
        if (row.length) tableData.push(row);
      });

      if (headers.length || tableData.length) {
        autoTable(doc, {
          startY: y,
          head: headers.length ? [headers] : undefined,
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
        });
        y = (doc as any).lastAutoTable.finalY + 15;
      }
    }
  });

  // Footer on last page
  addPDFFooter(doc, pageNum);

  doc.save(filename);
};

function addPDFFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 40;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(67, 67, 67);

  // Horizontal line
  doc.setDrawColor(160, 160, 160);
  doc.line(margin, pageHeight - 60, pageWidth - margin, pageHeight - 60);

  // Footer text line 1
  const line1 = doc.splitTextToSize(DATAMELLON_FOOTER.line1, pageWidth - margin * 2);
  doc.text(line1, margin, pageHeight - 50);

  // Footer text line 2
  const line2 = doc.splitTextToSize(DATAMELLON_FOOTER.line2, pageWidth - margin * 2);
  doc.text(line2, margin, pageHeight - 35);

  // Page number (right aligned)
  doc.setFontSize(9);
  doc.text(`Page | ${pageNum}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
}

/* ===============================
   WORD EXPORT - EXACT TEMPLATE REPLICATION
================================ */

export const exportToWord = async (
  html: string,
  logoBase64: string,
  filename = `Datamellon_SOW_${new Date().toLocaleDateString()}.docx`
) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');

  // === EXTRACT CLIENT NAME AND DATE ===
  let clientName = 'Client Name';
  let projectMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Try to extract from HTML
  const firstH1 = dom.querySelector('h1');
  if (firstH1 && firstH1.textContent) {
    const match = firstH1.textContent.match(/Datamellon\s*-\s*(.+)/);
    if (match) clientName = match[1].trim();
  }

  // === LOAD LOGO ===
  let logoBytes: Uint8Array | undefined;
  if (logoBase64) {
    try {
      const base64Data = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
      const cleanBase64 = base64Data.replace(/\s/g, '');
      logoBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    } catch (error) {
      console.warn('Logo error:', error);
    }
  }

  // === SECTION 1: COVER PAGE ===
  const coverPage: Paragraph[] = [];

  // Logo image (top left position)
  if (logoBytes) {
    coverPage.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new ImageRun({
            data: logoBytes,
            transformation: { width: 136, height: 22 },
            type: 'png',
            floating: {
              horizontalPosition: { offset: 1 },
              verticalPosition: { offset: 285750 }, // Position from template
              wrap: {
                type: 0,
              },
              behindDocument: true,
              allowOverlap: true,
              lockAnchor: false,
            },
          }),
        ],
      })
    );
  }

  // Vertical spacing (empty paragraphs)
  for (let i = 0; i < 10; i++) {
    coverPage.push(new Paragraph({ text: '', spacing: { after: 240 } }));
  }

  // Title: "Datamellon - [Client Name]" - Font size 27pt (54 half-points)
  coverPage.push(
    new Paragraph({
      text: `Datamellon - ${clientName}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      run: {
        size: 54, // 27pt
        font: 'Calibri',
      },
    })
  );

  // Empty line
  coverPage.push(
    new Paragraph({
      text: '',
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    })
  );

  // Date: "[Month Year]" - Font size 27pt
  coverPage.push(
    new Paragraph({
      text: projectMonth,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      run: {
        size: 54, // 27pt
        font: 'Calibri',
      },
    })
  );

  // Page break
  coverPage.push(new Paragraph({ children: [new PageBreak()] }));

  // === SECTION 2: TABLE OF CONTENTS ===
  const tocSection: Paragraph[] = [
    new Paragraph({
      text: 'Table of Contents',
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // === SECTION 3: CONTENT BODY ===
  const content: any[] = [];

  dom.body.childNodes.forEach((node: any) => {
    if (node.tagName === 'H1') {
      content.push(
        new Paragraph({
          text: node.textContent || '',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 240 },
        })
      );
    } else if (node.tagName === 'H2') {
      content.push(
        new Paragraph({
          text: node.textContent || '',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 180 },
        })
      );
    } else if (node.tagName === 'H3') {
      content.push(
        new Paragraph({
          text: node.textContent || '',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 140 },
        })
      );
    } else if (node.tagName === 'P') {
      // Handle highlighted text (mark tags)
      const children: any[] = [];
      node.childNodes.forEach((child: any) => {
        if (child.tagName === 'MARK') {
          children.push(
            new TextRun({
              text: child.textContent || '',
              highlight: 'yellow',
            })
          );
        } else if (child.tagName === 'STRONG' || child.tagName === 'B') {
          children.push(
            new TextRun({
              text: child.textContent || '',
              bold: true,
            })
          );
        } else {
          children.push(new TextRun(child.textContent || ''));
        }
      });

      content.push(
        new Paragraph({
          children: children.length ? children : [new TextRun(node.textContent || '')],
          spacing: { after: 120 },
        })
      );
    } else if (node.tagName === 'UL') {
      node.querySelectorAll('li').forEach((li: any) => {
        content.push(
          new Paragraph({
            text: li.textContent || '',
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      });
    } else if (node.tagName === 'OL') {
      node.querySelectorAll('li').forEach((li: any, index: number) => {
        content.push(
          new Paragraph({
            text: li.textContent || '',
            numbering: { reference: 'default-numbering', level: 0 },
            spacing: { after: 60 },
          })
        );
      });
    } else if (node.tagName === 'TABLE') {
      const rows: TableRow[] = [];

      // Header row
      const headerRow = node.querySelector('thead tr');
      if (headerRow) {
        const headerCells: TableCell[] = [];
        headerRow.querySelectorAll('th').forEach((th: any) => {
          headerCells.push(
            new TableCell({
              children: [new Paragraph({ text: th.textContent || '' })],
              shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
            })
          );
        });
        if (headerCells.length) rows.push(new TableRow({ children: headerCells }));
      }

      // Body rows
      node.querySelectorAll('tbody tr').forEach((tr: any) => {
        const cells: TableCell[] = [];
        tr.querySelectorAll('td').forEach((td: any) => {
          cells.push(
            new TableCell({
              children: [new Paragraph({ text: td.textContent || '' })],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
            })
          );
        });
        if (cells.length) rows.push(new TableRow({ children: cells }));
      });

      if (rows.length) {
        content.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          })
        );
        content.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
    }
  });

  // === FOOTER (Exact template format) ===
  const footer = new Footer({
    children: [
      // Empty paragraph
      new Paragraph({ text: '', spacing: { after: 0, line: 240 } }),
      
      // Horizontal line (represented by empty paragraph with shading)
      new Paragraph({
        text: '',
        border: {
          top: { style: BorderStyle.SINGLE, size: 2, color: 'A0A0A0' },
        },
        spacing: { after: 0 },
      }),

      // Line 1
      new Paragraph({
        children: [
          new TextRun({ text: 'DATAMELLON LIMITED', bold: true, size: 16, color: '434343' }),
          new TextRun({ text: ' | ', size: 16, color: '434343' }),
          new TextRun({ text: 'T: ', bold: true, size: 16, color: '434343' }),
          new TextRun({
            text: '+442039954988, +23416331141, +23416331142,  +2348147728469 |',
            size: 16,
            color: '434343',
          }),
          new TextRun({ text: ' W:', bold: true, size: 16, color: '434343' }),
          new TextRun({ text: ' ', size: 16, color: '434343' }),
          new ExternalHyperlink({
            children: [new TextRun({ text: 'https://datamellon.com', size: 16, color: '434343', underline: {} })],
            link: 'https://datamellon.com',
          }),
          new TextRun({ text: ' | ', size: 16, color: '434343' }),
          new TextRun({ text: 'E', bold: true, size: 16, color: '434343' }),
          new TextRun({ text: ': ', size: 16, color: '434343' }),
          new ExternalHyperlink({
            children: [
              new TextRun({ text: 'connect@datamellon.com', size: 16, color: '434343', underline: {} }),
            ],
            link: 'mailto:connect@datamellon.com',
          }),
        ],
        spacing: { after: 0 },
      }),

      // Line 2
      new Paragraph({
        children: [
          new TextRun({ text: 'London Office:', bold: true, size: 16, color: '434343' }),
          new TextRun({
            text: ' Epworth House, 25 City Rd, Shoreditch, London EC1Y 1AA, United Kingdom | ',
            size: 16,
            color: '434343',
          }),
          new TextRun({ text: 'Lagos Office:', bold: true, size: 16, color: '434343' }),
          new TextRun({
            text: ' NIJ House, Plot 20, Adeyemo Alakija Street, Victoria Island, Lagos, Nigeria',
            size: 16,
            color: '434343',
          }),
        ],
        spacing: { after: 0 },
      }),

      // Empty line
      new Paragraph({ text: '', spacing: { after: 0 } }),

      // Page number (right-aligned)
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'Page | ', size: 18, color: '434343' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '434343' }),
        ],
      }),
    ],
  });

  // === CREATE DOCUMENT ===
  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 36, bold: true, font: 'Calibri', color: '000000' },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, font: 'Calibri', color: '000000' },
          paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, font: 'Calibri', color: '000000' },
          paragraph: { spacing: { before: 140, after: 140 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE.width,
              height: PAGE.height,
            },
            margin: PAGE.margin,
          },
        },
        footers: {
          default: footer,
        },
        children: [...coverPage, ...tocSection, ...content],
      },
    ],
  });

  // === EXPORT ===
  const blob = await Packer.toBlob(document);
  saveAs(blob, filename);
};