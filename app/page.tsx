'use client';

import React, { useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import DocumentEditor from '@/components/DocumentEditor';
import AIAssistant from '@/components/AIAssistant';
import { useSOWStore } from '@/store/sowStore';
import { Message, UploadedFile } from '@/types';
import { exportToPDF, exportToWord } from '@/lib/exportUtils';

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
    saveCurrentDocument
  } = useSOWStore();

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const uploadedFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          content: e.target?.result as string
        };
        addUploadedFile(uploadedFile);
        
        // Send a message to AI
        const message: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `File "${file.name}" uploaded successfully! I can now use this as context for generating your SOW.`
        };
        addMessage(message);
      };
      reader.readAsText(file);
    });
  }, [addUploadedFile, addMessage]);

  // Handle sending messages
  const handleSendMessage = useCallback((content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    addMessage(userMessage);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you with that. ${uploadedFiles.length > 0 ? `I see you've uploaded ${uploadedFiles.length} file(s) for context.` : ''} Let me generate a professional SOW based on your requirements.`
      };
      addMessage(aiMessage);
    }, 1000);
  }, [addMessage, uploadedFiles.length]);

  // Handle SOW generation
  const handleGenerate = useCallback(() => {
    const context = uploadedFiles.map(f => f.name).join(', ');
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    
    const generatedContent = `
      <h1>Statement of Work</h1>
      <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
      
      <h2>1. Project Overview</h2>
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
      <p>The project is estimated to be completed within 8-12 weeks from project kickoff. Key milestones include:</p>
      <ul>
        <li><strong>Week 1-2:</strong> Requirements gathering and project planning</li>
        <li><strong>Week 3-6:</strong> Design and development phase</li>
        <li><strong>Week 7-8:</strong> Testing and quality assurance</li>
        <li><strong>Week 9-10:</strong> User acceptance testing and feedback</li>
        <li><strong>Week 11-12:</strong> Final deployment and handover</li>
      </ul>
      
      <h2>5. Roles & Responsibilities</h2>
      <p><strong>Service Provider:</strong></p>
      <ul>
        <li>Provide technical expertise and resources</li>
        <li>Deliver all agreed-upon deliverables on time</li>
        <li>Maintain clear communication throughout the project</li>
      </ul>
      <p><strong>Client:</strong></p>
      <ul>
        <li>Provide timely feedback and approvals</li>
        <li>Supply necessary access and information</li>
        <li>Designate key stakeholders for decision-making</li>
      </ul>
      
      <h2>6. Assumptions & Constraints</h2>
      <p>This SOW is based on the following assumptions:</p>
      <ul>
        <li>All required resources and access will be provided in a timely manner</li>
        <li>Project scope remains consistent with initial requirements</li>
        <li>Key stakeholders are available for regular reviews</li>
      </ul>
      
      ${context ? `<p><em>Context files referenced: ${context}</em></p>` : ''}
      ${userMessages ? `<p><em>Based on requirements: ${userMessages.substring(0, 200)}${userMessages.length > 200 ? '...' : ''}</em></p>` : ''}
      
      <h2>7. Acceptance Criteria</h2>
      <p>The project will be considered complete when all deliverables have been provided and approved by the client, and all acceptance criteria have been met.</p>
      
      <hr>
      <p><em>This Statement of Work is subject to the terms and conditions outlined in the Master Services Agreement between the parties.</em></p>
    `;
    
    updateDocument(generatedContent);
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I\'ve generated a comprehensive Statement of Work based on your requirements. You can now edit it in the main editor, format it as needed, and export it when ready!'
    };
    addMessage(aiMessage);
  }, [uploadedFiles, messages, updateDocument, addMessage]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!currentDocument) {
      alert('Please create or generate a document first!');
      return;
    }

    const title = prompt('Enter document title:', 'New Statement of Work');
    if (title) {
      saveCurrentDocument(title);
      alert('Document saved successfully!');
    }
  }, [currentDocument, saveCurrentDocument]);

  // Handle export
  const handleExport = useCallback((format: 'pdf' | 'word') => {
    if (!currentDocument) {
      alert('Please generate or create a document first!');
      return;
    }

    const filename = `sow-${Date.now()}`;
    
    try {
      if (format === 'pdf') {
        exportToPDF(currentDocument, `${filename}.pdf`);
        alert('PDF exported successfully!');
      } else {
        exportToWord(currentDocument, `${filename}.docx`);
        alert('Word document exported successfully!');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    }
  }, [currentDocument]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        recentFiles={recentFiles}
        onFileSelect={selectFile}
        onUpload={handleFileUpload}
        uploadedFiles={uploadedFiles}
        onRemoveFile={removeUploadedFile}
      />
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
      />
    </div>
  );
}