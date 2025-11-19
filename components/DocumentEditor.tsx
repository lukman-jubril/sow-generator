'use client';

import React, { useRef, useState } from 'react';
import { 
  Share2, 
  Download, 
  Settings, 
  FileText, 
  Save, 
  Bold, 
  Italic, 
  List, 
  AlignLeft 
} from 'lucide-react';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onExport: (format: 'pdf' | 'word') => void;
}

export default function DocumentEditor({ 
  content, 
  onChange, 
  onSave, 
  onExport 
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Statement of Work</h1>
            <p className="text-sm text-gray-500 mt-1">Powered by Datamellon AI</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button 
                    onClick={() => { 
                      onExport('pdf'); 
                      setShowExportMenu(false); 
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-black" 
                  >
                    Export as PDF
                  </button>
                  <button 
                    onClick={() => { 
                      onExport('word'); 
                      setShowExportMenu(false); 
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-black"
                  >
                    Export as Word
                  </button>
                </div>
              )}
            </div>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {content && (
        <div className="border-b border-gray-200 px-8 py-2 flex items-center gap-2">
          <button 
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => applyFormat('italic')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <button 
            onClick={() => applyFormat('insertUnorderedList')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => applyFormat('insertOrderedList')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Numbered List"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <select 
            onChange={(e) => applyFormat('formatBlock', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {content ? (
          <div 
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            dangerouslySetInnerHTML={{ __html: content }}
            className="max-w-4xl mx-auto min-h-full p-8 bg-white border border-gray-200 rounded-lg focus:outline-none prose prose-sm max-w-none"
            style={{ minHeight: '800px' }}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Generate your professional SOW with AI
        </h2>
        
        <p className="text-gray-600 mb-8">
          Use the assistant on the right to get started. Upload context files or describe your project requirements.
        </p>

        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Real-time generation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Professional formatting</span>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Tips:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Upload context files to provide project background</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Edit the document in real-time as it generates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Export to PDF or Word format when ready</span>
          </li>
        </ul>
      </div>
    </div>
  );
}