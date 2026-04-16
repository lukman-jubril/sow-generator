"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import { marked } from "marked";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import DocxPreview from "@/components/DocxPreview";
import { useSOWStore } from "@/store/sowStore";
import { Message } from "@/types";
import { exportToPDF, exportToWord } from "@/lib/exportUtils";
import { exportToWordFromTemplate } from "@/lib/templateExport";
import {
  startJob,
  pollUntilComplete,
  downloadDocx,
  getDownloadUrl,
  type StatusResponse,
  type GenerateSowRequest,
  type StartJobResponse,
} from "@/lib/sowApi";
import Loader from "@/components/Loader";
import { useToast, useModal } from "@/components/UiProvider";
import { extractLogoDataUrlFromTemplate } from "@/lib/templateExport";
import { generateCoverHtml } from "@/lib/coverPage";

const resolveDocxUrl = (
  status: StatusResponse,
  jobId: string,
): string | null => {
  if (status.s3_url) {
    if (status.s3_url.startsWith("s3://")) {
      return getDownloadUrl(jobId);
    }
    return status.s3_url;
  }
  if (status.docx_path) {
    if (status.docx_path.startsWith("http")) return status.docx_path;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://sow-gen.onrender.com";
    const normalizedPath = status.docx_path.startsWith("/")
      ? status.docx_path
      : `/${status.docx_path}`;
    return `${baseUrl}${normalizedPath}`;
  }
  return getDownloadUrl(jobId);
};

const renderDocxUrlToHtml = async (
  docxUrl: string,
): Promise<{ html: string; buffer: ArrayBuffer }> => {
  const response = await fetch(docxUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch DOCX: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const container = document.createElement("div");

  await renderAsync(arrayBuffer, container, undefined, {
    inWrapper: false,
    ignoreWidth: true,
    ignoreHeight: true,
  });

  return { html: container.innerHTML || "", buffer: arrayBuffer };
};

export default function Home() {
  const {
    currentDocument,
    recentFiles,
    messages,
    selectedFile,
    updateDocument,
    addMessage,
    clearMessages,
    setMessages,
    selectFile,
    saveCurrentDocument,
    clientLogoDataUrl,
    isHydrated,
  } = useSOWStore();

  const { showToast } = useToast();
  const { prompt } = useModal();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const originalDocxBufferRef = useRef<ArrayBuffer | null>(null);
  const [previewDocxBuffer, setPreviewDocxBuffer] =
    useState<ArrayBuffer | null>(null);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    useSOWStore.persist.rehydrate();
  }, []);

  // Generate SOW with API (async flow: start job → poll → complete)
  const handleGenerateFromPayload = useCallback(
    async (payload: GenerateSowRequest) => {
      setIsGenerating(true);
      setGenerationStatus("Starting...");
      setLastJobId(null);
      setPreviewDocxBuffer(null);

      const loadingMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Generating your Statement of Work... This may take 2–15 minutes. Please wait.",
      };
      addMessage(loadingMessage);

      try {
        // 1. Start job (backend may return async job_id or immediate download_url)
        const startResult: StartJobResponse = await startJob({
          sponsor_name: "TBD",
          sponsor_title: "TBD",
          sponsor_email: "TBD",
          ...payload,
        });
        if ("download_url" in startResult) {
          const fullDownloadUrl = getDownloadUrl(startResult.download_url);
          setGenerationStatus("Rendering document...");

          const { html: docxHtml, buffer: docxBuffer } =
            await renderDocxUrlToHtml(fullDownloadUrl);
          if (!docxHtml) {
            throw new Error("DOCX render returned empty content");
          }

          originalDocxBufferRef.current = docxBuffer;
          setPreviewDocxBuffer(docxBuffer);
          setLastJobId(startResult.download_url);

          addMessage({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "Your DOCX is ready. Preview it in the center panel, export to PDF, or download the DOCX.",
          });
          return;
        }

        const { job_id } = startResult;
        setGenerationStatus("Queued");

        // 2. Poll until completed
        const result = await pollUntilComplete(
          job_id,
          (status: StatusResponse) => {
            setGenerationStatus(
              status.status === "queued"
                ? "Queued"
                : status.status === "running"
                  ? "Running..."
                  : status.status,
            );
          },
          { intervalMs: 7000, timeoutMs: 20 * 60 * 1000 },
        );

        // 3. Completed - render DOCX (including template) into editable HTML
        const docxUrl = resolveDocxUrl(result, job_id);
        if (docxUrl) {
          try {
            setGenerationStatus("Rendering document...");
            const { html: docxHtml, buffer: docxBuffer } =
              await renderDocxUrlToHtml(docxUrl);
            if (docxHtml) {
              originalDocxBufferRef.current = docxBuffer;
              setPreviewDocxBuffer(docxBuffer);
              setLastJobId(job_id);

              const successMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content:
                  "Your DOCX (with template styling) is ready. Preview it in the center panel, export to PDF, or download the DOCX.",
              };
              addMessage(successMessage);
              return;
            }
          } catch (error) {
            console.warn("DOCX render failed, falling back to markdown", error);
          }
        }

        // Fallback - update document with markdown converted to HTML
        const htmlContent = result.markdown
          ? (marked.parse(result.markdown) as string)
          : "<p>No content generated.</p>";

        // Try to extract logo from template and prepend a cover page
        let logoDataUrl: string | null = null;
        try {
          logoDataUrl = await extractLogoDataUrlFromTemplate(
            "templates/Datamellon_SOW_Template.docx",
          );
        } catch (e) {
          console.warn("Failed to extract logo for cover page", e);
        }

        const finalHtml = generateCoverHtml(
          htmlContent,
          logoDataUrl || undefined,
          clientLogoDataUrl || undefined,
        );
        updateDocument(finalHtml);
        setLastJobId(job_id);

        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            'I\'ve generated a comprehensive Statement of Work. You can edit it in the editor, or click "Download DOCX" to get the server-generated Word document.',
        };
        addMessage(successMessage);
      } catch (error) {
        console.error("Generation error:", error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, there was an error generating your SOW: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please try again.`,
        };
        addMessage(errorMessage);

        const fallbackContent = `
    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
      <h3 style="color: #92400E; margin-top: 0; font-size: 18px; font-weight: 600;">⚠️ Generation Service Unavailable</h3>
      <p style="color: #78350F; margin-bottom: 12px;">
        We're unable to connect to the AI generation service at the moment. This could be due to:
      </p>
      <ul style="color: #78350F; margin-left: 20px;">
        <li>Network connectivity issues</li>
        <li>Service temporarily down for maintenance</li>
        <li>API configuration needs to be set up</li>
      </ul>
      <p style="color: #78350F; margin-bottom: 0;">
        <strong>What to do:</strong> Please check your internet connection and try again in a few moments. 
        If the problem persists, contact your system administrator.
      </p>
    </div>
    
    <h1>Statement of Work - Draft Template</h1>
    <p><em>Generated on ${new Date().toLocaleDateString()} • Template Version</em></p>
    
    <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #374151; margin: 0;">
        <strong>Note:</strong> This is a basic template. For a customized SOW based on your specific requirements, 
        please ensure the generation service is available and try generating again.
      </p>
    </div>
    
    <h2>1. Project Overview</h2>
    <p style="color: #6B7280;">[To be customized based on your project requirements]</p>
    <p>This Statement of Work outlines the project scope, deliverables, timeline, and responsibilities for the engagement between the parties.</p>
    
    <h2>2. Scope of Work</h2>
    <p>The project includes the following key components:</p>
    <ul>
      <li><strong>Requirements Gathering:</strong> Comprehensive analysis of project needs and objectives</li>
      <li><strong>Design & Development:</strong> Creation of solutions based on approved specifications</li>
      <li><strong>Testing & Quality Assurance:</strong> Rigorous testing to ensure quality standards</li>
      <li><strong>Deployment & Support:</strong> Implementation and ongoing maintenance</li>
    </ul>
    
    <h2>3. Deliverables</h2>
    <p>The following deliverables will be provided upon completion:</p>
    <ol>
      <li>Complete project documentation</li>
      <li>Source code and development assets</li>
      <li>User training materials and guides</li>
      <li>Technical support and maintenance plan</li>
    </ol>
    
    <h2>4. Timeline & Milestones</h2>
    <p style="color: #6B7280;">[Customize timeline based on project scope]</p>
    
    <h2>5. Roles & Responsibilities</h2>
    <p style="color: #6B7280;">[Define specific roles for your project]</p>
    
    <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 16px; margin-top: 24px; border-radius: 8px;">
      <p style="color: #1E40AF; margin: 0;">
        💡 <strong>Tip:</strong> You can edit this template manually and save it, or wait until the generation 
        service is available to create a fully customized SOW based on your uploaded files and requirements.
      </p>
    </div>
  `;
        // Prepend a cover page to the fallback content as well
        try {
          const logo = await extractLogoDataUrlFromTemplate(
            "templates/Datamellon_SOW_Template.docx",
          );
          updateDocument(
            generateCoverHtml(
              fallbackContent,
              logo || undefined,
              clientLogoDataUrl || undefined,
            ),
          );
        } catch (e) {
          updateDocument(
            generateCoverHtml(
              fallbackContent,
              undefined,
              clientLogoDataUrl || undefined,
            ),
          );
        }
      } finally {
        setIsGenerating(false);
        setGenerationStatus(null);
      }
    },
    [addMessage],
  );

  const handleGenerateSow = useCallback(
    (payload: GenerateSowRequest) => {
      const contextPreview =
        payload.context_text.length > 220
          ? `${payload.context_text.slice(0, 220)}…`
          : payload.context_text;

      // Atomically replace the chat with exactly what will be sent.
      setMessages([
        {
          id: Date.now().toString(),
          role: "user",
          content:
            `SOW Details\n` +
            `Client: ${payload.client_name}\n` +
            `Project: ${payload.project_title}\n` +
            `Timeline: ${payload.timeline_weeks} week(s)\n` +
            `AWS services: ${payload.aws_services}\n` +
            `Sponsor: ${payload.sponsor_name || "TBD"} (${payload.sponsor_title || "TBD"}) — ${payload.sponsor_email || "TBD"}\n` +
            `Context: ${contextPreview}`,
        },
      ]);
      setTimeout(() => handleGenerateFromPayload(payload), 0);
    },
    [setMessages, handleGenerateFromPayload],
  );

  // Download the server-generated DOCX
  const handleDownloadDocx = useCallback(async () => {
    if (!lastJobId) return;
    try {
      const blob = await downloadDocx(lastJobId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Statement_of_Work.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ message: "Downloaded DOCX successfully", type: "success" });
    } catch (error) {
      console.error("Download error:", error);
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to download DOCX",
        type: "error",
      });
    }
  }, [lastJobId]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!currentDocument) {
      showToast({
        message: "Please create or generate a document first!",
        type: "info",
      });
      return;
    }

    const title = await prompt(
      "Enter document title:",
      "New Statement of Work",
    );
    if (title) {
      saveCurrentDocument(title);
      showToast({ message: "Document saved successfully!", type: "success" });
    }
  }, [currentDocument, saveCurrentDocument, prompt, showToast]);

  // Handle export
  const handleExport = useCallback(
    async (format: "pdf" | "word") => {
      const filename = `Datamellon_SOW_${new Date().toISOString().slice(0, 10)}`;

      try {
        if (format === "pdf") {
          // Try to extract logo from template (falls back to no logo)
          const logo = await extractLogoDataUrlFromTemplate(
            "/templates/Datamellon_SOW_Template.docx",
          );

          // Export PDF from the backend-generated DOCX (best formatting match).
          // Prefer in-memory buffer; otherwise fetch the DOCX from the API download URL.
          let docxBufferToRender: ArrayBuffer | null =
            originalDocxBufferRef.current || previewDocxBuffer;

          if (!docxBufferToRender && lastJobId) {
            const url = getDownloadUrl(lastJobId);
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch DOCX for PDF: ${response.status}`,
              );
            }
            docxBufferToRender = await response.arrayBuffer();
            // Cache it for subsequent exports
            originalDocxBufferRef.current = docxBufferToRender;
            setPreviewDocxBuffer(docxBufferToRender);
          }

          if (docxBufferToRender) {
            const container = document.createElement("div");
            await renderAsync(docxBufferToRender, container, undefined, {
              inWrapper: false,
              ignoreWidth: true,
              ignoreHeight: true,
            });
            await exportToPDF(
              container.innerHTML || currentDocument || "<p></p>",
              logo ?? "",
              `${filename}.pdf`,
            );
          } else {
            showToast({
              message: "Please generate a document first to export as PDF.",
              type: "info",
            });
            return;
          }

          showToast({ message: "PDF exported successfully!", type: "success" });
        } else {
          // Prefer the backend-generated DOCX when available (best formatting)
          if (lastJobId) {
            await handleDownloadDocx();
            showToast({
              message: "Downloaded DOCX from API (best formatting).",
              type: "success",
            });
            return;
          }

          if (!currentDocument) {
            showToast({
              message: "Please generate a document first to export as Word.",
              type: "info",
            });
            return;
          }

          // Use Datamellon template for Word export
          await exportToWordFromTemplate(
            currentDocument,
            "/templates/Datamellon_SOW_Template.docx",
            `${filename}.docx`,
            originalDocxBufferRef.current ?? undefined,
          );
          showToast({
            message: "Word document exported successfully!",
            type: "success",
          });
        }
      } catch (error) {
        console.error("Export error:", error);
        showToast({
          message: `Failed to export as ${format.toUpperCase()}. Please try again.`,
          type: "error",
        });
      }
    },
    [
      currentDocument,
      showToast,
      lastJobId,
      handleDownloadDocx,
      previewDocxBuffer,
    ],
  );

  return (
    <>
      {!isHydrated ? (
        <div className="w-full h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 h-screen overflow-hidden">
          {isGenerating && <Loader status={generationStatus} />}
          <Sidebar recentFiles={recentFiles} onFileSelect={selectFile} />
          <DocxPreview
            docxBuffer={previewDocxBuffer}
            isGenerating={isGenerating}
            onDownloadDocx={lastJobId ? handleDownloadDocx : undefined}
            onDownloadWord={lastJobId ? handleDownloadDocx : undefined}
            onExportPdf={() => handleExport("pdf")}
          />
          <AIAssistant
            messages={messages}
            onGenerateSow={handleGenerateSow}
            isGenerating={isGenerating}
          />
        </div>
      )}
    </>
  );
}
