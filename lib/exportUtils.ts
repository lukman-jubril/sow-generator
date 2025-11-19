'use client';

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export const exportToPDF = (content: string, filename: string = 'statement-of-work.pdf') => {
  const doc = new jsPDF();
  
  // Remove HTML tags for simple text export
  const text = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Add text to PDF with word wrapping
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const lineHeight = 7;
  const maxLineWidth = pageWidth - (margin * 2);
  
  const lines = doc.splitTextToSize(text, maxLineWidth);
  
  let y = margin;
  lines.forEach((line: string) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });
  
  // Save the PDF
  doc.save(filename);
};

export const exportToWord = async (content: string, filename: string = 'statement-of-work.docx') => {
  try {
    // Parse HTML content into sections
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(content, 'text/html');
    
    const children: any[] = [];
    
    // Process each element
    htmlDoc.body.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent || '';
        
        if (tagName === 'h1') {
          children.push(
            new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            })
          );
        } else if (tagName === 'h2') {
          children.push(
            new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (tagName === 'h3') {
          children.push(
            new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 160, after: 80 },
            })
          );
        } else if (tagName === 'p') {
          // Handle paragraphs with formatting
          const runs: TextRun[] = [];
          
          if (element.innerHTML.includes('<strong>') || element.innerHTML.includes('<em>')) {
            // Parse inner HTML for formatting
            element.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                runs.push(new TextRun(child.textContent || ''));
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childElement = child as HTMLElement;
                const childText = childElement.textContent || '';
                
                if (childElement.tagName === 'STRONG' || childElement.tagName === 'B') {
                  runs.push(new TextRun({ text: childText, bold: true }));
                } else if (childElement.tagName === 'EM' || childElement.tagName === 'I') {
                  runs.push(new TextRun({ text: childText, italics: true }));
                } else {
                  runs.push(new TextRun(childText));
                }
              }
            });
          } else {
            runs.push(new TextRun(text));
          }
          
          children.push(
            new Paragraph({
              children: runs,
              spacing: { before: 100, after: 100 },
            })
          );
        } else if (tagName === 'ul' || tagName === 'ol') {
          // Handle lists
          const listItems = element.querySelectorAll('li');
          listItems.forEach((li, index) => {
            children.push(
              new Paragraph({
                text: li.textContent || '',
                bullet: tagName === 'ul' ? { level: 0 } : undefined,
                numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                spacing: { before: 50, after: 50 },
              })
            );
          });
        } else if (tagName === 'hr') {
          children.push(
            new Paragraph({
              text: '',
              border: {
                bottom: {
                  color: 'E5E7EB',
                  space: 1,
                  style: 'single',
                  size: 6,
                },
              },
              spacing: { before: 200, after: 200 },
            })
          );
        } else {
          // Default paragraph
          if (text.trim()) {
            children.push(
              new Paragraph({
                text: text,
                spacing: { before: 100, after: 100 },
              })
            );
          }
        }
      }
    });
    
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });
    
    // Generate and save document
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
    
  } catch (error) {
    console.error('Error exporting to Word:', error);
    
    // Fallback: download as HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Statement of Work</title>
          <style>
            @page {
              size: A4;
              margin: 1in;
            }
            body {
              font-family: 'Raleway', 'Calibri', Arial, sans-serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            h1 {
              color: #16a34a;
              border-bottom: 3px solid #16a34a;
              padding-bottom: 10px;
              margin-top: 0;
              font-size: 28px;
            }
            h2 {
              color: #16a34a;
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 20px;
            }
            h3 {
              color: #333;
              margin-top: 20px;
              margin-bottom: 10px;
              font-size: 16px;
            }
            ul, ol {
              margin-left: 25px;
              margin-bottom: 15px;
            }
            li {
              margin-bottom: 8px;
            }
            p {
              margin: 10px 0;
            }
            strong {
              color: #16a34a;
            }
            em {
              color: #666;
            }
            hr {
              border: none;
              border-top: 2px solid #e5e7eb;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveAs(blob, filename.replace('.docx', '.html'));
  }
};