"use client";

import React, { useCallback, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DocumentEditor from "@/components/DocumentEditor";
import AIAssistant from "@/components/AIAssistant";
import { useSOWStore } from "@/store/sowStore";
import { Message, UploadedFile } from "@/types";
import { exportToPDF, exportToWord } from "@/lib/exportUtils";
import Loader from "@/components/Loader";

export default function Home() {
  const {
    currentDocument,
    uploadedFiles,
    recentFiles,
    messages,
    selectedFile,
    updateDocument,
    addUploadedFile,
    removeUploadedFile,
    addMessage,
    selectFile,
    saveCurrentDocument,
  } = useSOWStore();

  const [isGenerating, setIsGenerating] = useState(false);

  console.log("Messages:", messages);

  // Handle file upload with base64 encoding
  const handleFileUpload = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Content = e.target?.result as string;

          const uploadedFile: UploadedFile = {
            id: Date.now().toString() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            content: base64Content,
          };

          console.log("Uploaded file (base64):", uploadedFile);
          addUploadedFile(uploadedFile);

          const message: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `File "${file.name}" uploaded successfully! I can now use this as context for generating your SOW.`,
          };
          addMessage(message);
        };

        reader.onerror = (error) => {
          console.error("File reading error:", error);
          alert(`Failed to read file: ${file.name}`);
        };

        reader.readAsDataURL(file);
      });
    },
    [addUploadedFile, addMessage]
  );

  // Handle sending messages
  const handleSendMessage = useCallback(
    (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      addMessage(userMessage);

      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Got it! ${
            uploadedFiles.length > 0
              ? `I see you've uploaded ${uploadedFiles.length} file(s) for context.`
              : ""
          } Click "Generate SOW" when you're ready, and I'll create a professional Statement of Work based on your requirements.`,
        };
        addMessage(aiMessage);
      }, 500);
    },
    [addMessage, uploadedFiles.length]
  );

  // Handle SOW generation with API
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");

    const prompt =
      userMessages ||
      "Generate a comprehensive Statement of Work with standard sections including project overview, scope, deliverables, timeline, and responsibilities.";

    const body = `body`;

    const loadingMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Generating your Statement of Work... This may take a moment.",
    };
    addMessage(loadingMessage);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

      const form = new FormData();
      form.append("prompt", prompt);
      form.append("body", body);
      form.append("include_pricing", "true");
      form.append("include_diagram", "false");

      // Convert base64 back to Blob and append to FormData
      for (const file of uploadedFiles) {
        const response = await fetch(file.content);
        const blob = await response.blob();
        form.append("context_files", blob, file.name);
      }

      const response = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Res", data);

      const generatedContent =
        data.html || data.markdown || "<p>No content generated.</p>";

      updateDocument(generatedContent);

      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I've generated a comprehensive Statement of Work based on your requirements. You can now edit it in the main editor, format it as needed, and export it when ready!",
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
      updateDocument(fallbackContent);
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedFiles, messages, updateDocument, addMessage]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!currentDocument) {
      alert("Please create or generate a document first!");
      return;
    }

    const title = prompt("Enter document title:", "New Statement of Work");
    if (title) {
      saveCurrentDocument(title);
      alert("Document saved successfully!");
    }
  }, [currentDocument, saveCurrentDocument]);

  // Handle export
  const handleExport = useCallback(
    (format: "pdf" | "word") => {
      if (!currentDocument) {
        alert("Please generate or create a document first!");
        return;
      }

      const filename = `sow-${Date.now()}`;

      try {
        if (format === "pdf") {
          exportToPDF(currentDocument, `${filename}.pdf`);
          alert("PDF exported successfully!");
        } else {
          exportToWord(currentDocument, `${filename}.docx`);
          alert("Word document exported successfully!");
        }
      } catch (error) {
        console.error("Export error:", error);
        alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
      }
    },
    [currentDocument]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {isGenerating && <Loader />}
      <Sidebar recentFiles={recentFiles} onFileSelect={selectFile} />
      <DocumentEditor
        content={currentDocument}
        onChange={updateDocument}
        onSave={handleSave}
        onExport={handleExport}
      />
      <AIAssistant
        messages={messages}
        onSendMessage={handleSendMessage}
        onGenerate={handleGenerate}
        uploadedFiles={uploadedFiles}
        onUpload={handleFileUpload}
        onRemoveFile={removeUploadedFile}
      />
    </div>
  );
}
