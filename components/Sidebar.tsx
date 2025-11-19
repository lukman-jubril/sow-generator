'use client';

import React, { useState, useRef } from 'react';
import { FileText, Upload, Clock, X, File } from 'lucide-react';
import { RecentFile, UploadedFile } from '@/types';

interface SidebarProps {
  recentFiles: RecentFile[];
  onFileSelect: (file: RecentFile) => void;
  onUpload: (files: FileList) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

export default function Sidebar({
  recentFiles,
  onFileSelect,
  onUpload,
  uploadedFiles,
  onRemoveFile
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = recentFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Documents</h2>
        </div>
        
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Upload Section */}
      <div className="p-4">
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && onUpload(e.target.files)}
            className="hidden"
            accept=".txt,.pdf,.doc,.docx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors mb-2"
          >
            Upload Files
          </button>
          <p className="text-xs text-gray-500">or drag and drop</p>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-700">Uploaded Context Files:</p>
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs flex-1 truncate">{file.name}</span>
                <button 
                  onClick={() => onRemoveFile(file.id)} 
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Files */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">RECENT FILES</h3>
          </div>

          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => onFileSelect(file)}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{file.timestamp}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{file.size}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {recentFiles.length} documents stored
        </p>
      </div>
    </div>
  );
}