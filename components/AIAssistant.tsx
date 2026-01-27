"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Message, UploadedFile } from "@/types";
import { Upload, X, File } from "lucide-react";

interface AIAssistantProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onGenerate: () => void;
  

  onUpload: (files: FileList) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

export default function AIAssistant({
  messages,
  onSendMessage,
  onGenerate,

  onUpload,
  uploadedFiles,
  onRemoveFile,
}: AIAssistantProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const hasUserMessage = messages.some(m => m.role === "user");

  
  

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">AI Assistant</h2>
        </div>
        <p className="text-xs text-gray-500">Powered by Claude Sonnet 4.5</p>
      </div>

      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm">👋</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Welcome to Datamellon SOW Generator!
              </p>
              <p className="text-sm text-gray-600 mb-3">
                I am ready to help you create professional Statements of Work.
              </p>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">You can:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Upload context files</li>
                  <li>• Describe your project</li>
                  <li>• Edit the document in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        {/* Upload Section */}
        <div className="mb-4">
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
              Upload Context Files
            </button>
            <p className="text-xs text-gray-500">or drag and drop</p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-700">
                Uploaded Context Files:
              </p>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200"
                >
                  <File className="w-4 h-4 text-gray-700 shrink-0" />
                  <span className="text-xs flex-1 text-gray-700 truncate">{file.name}</span>
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your SOW requirements..."
            className="flex-1 px-3 py-2 border border-gray-300 text-black rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            required
          />
          <button
            onClick={handleSend}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => onGenerate()}
          disabled={!hasUserMessage}
          className={`${hasUserMessage ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-200 text-gray-400"} w-full mt-3  py-3 rounded-lg font-medium  transition-colors flex items-center justify-center gap-2`}
        >
          <Send className="w-4 h-4" />
          Generate SOW
        </button>
      </div>
    </div>
  );
}
