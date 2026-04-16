'use client';

import React, { useState, useRef } from 'react';
import { FileText, Clock } from 'lucide-react';
import { RecentFile, UploadedFile } from '@/types';

interface SidebarProps {
  recentFiles: RecentFile[];
  onFileSelect: (file: RecentFile) => void;
  
}

export default function Sidebar({
  recentFiles,
  onFileSelect,
  
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  

  const filteredFiles = recentFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  return (
    <div className="col-span-1 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
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
                  <FileText className="w-5 h-5 text-green-600 mt-0.5" />
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