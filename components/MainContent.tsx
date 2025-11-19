'use client';

import React from 'react';
import { Share2, Download, Settings, FileText } from 'lucide-react';

export default function MainContent() {
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
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
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

          {/* Quick Tips */}
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
      </div>
    </div>
  );
}