"use client";

import React, { useRef, useState, useEffect } from "react";
import { useModal } from "./UiProvider";
import {
  Share2,
  Download,
  Settings,
  FileText,
  Save,
  Bold,
  Italic,
  List,
  AlignLeft,
  Underline,
  AlignCenter,
  AlignRight,
  Link,
  Highlighter,
  Type,
  Undo,
  Redo,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onExport: (format: "pdf" | "word") => void;
  lastJobId?: string | null;
  onDownloadDocx?: () => void;
}

export default function DocumentEditor({
  content,
  onChange,
  onSave,
  onExport,
  lastJobId,
  onDownloadDocx,
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null,
  );
  const resizeState = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    direction: string;
  }>({ startX: 0, startY: 0, startWidth: 0, startHeight: 0, direction: "" });
  const { prompt } = useModal();

  // Track active formatting states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });

  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
    };
  };

  const restoreCursorPosition = (position: any) => {
    if (!position) return;
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStart(position.startContainer, position.startOffset);
      range.setEnd(position.endContainer, position.endOffset);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch (e) {
      console.warn("Could not restore cursor position:", e);
    }
  };

  // Update active format states when selection changes
  const updateFormatStates = () => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
    });
  };

  const applyFormat = (command: string, value?: string) => {
    // Focus the editor first
    editorRef.current?.focus();

    // Execute the command
    document.execCommand(command, false, value);

    // Update format states
    updateFormatStates();

    // Trigger content update
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = async () => {
    const url = await prompt("Enter URL:");
    if (url) applyFormat("createLink", url);
  };

  const changeFontSize = (size: string) => {
    applyFormat("fontSize", size);
  };

  const changeTextColor = (color: string) => {
    applyFormat("foreColor", color);
  };

  const changeHighlight = (color: string) => {
    applyFormat("backColor", color);
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      const imgHtml = `<img src="${imageDataUrl}" style="max-width: 100%; height: auto; margin: 10px 0; cursor: move;" alt="Inserted image" class="editable-image" />`;
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, imgHtml);
      onChange(editorRef.current?.innerHTML || "");
      setTimeout(() => attachImageHandlers(), 0);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const attachImageHandlers = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.querySelectorAll("img.editable-image").forEach((img) => {
      (img as HTMLImageElement).removeEventListener("click", handleImageClick);
      (img as HTMLImageElement).addEventListener("click", handleImageClick);
    });
  };

  const handleImageClick = (
    e: React.MouseEvent<HTMLImageElement> | MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const img = e.target as HTMLImageElement;
    setSelectedImage(img);
  };

  const handleResizeStart = (direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImage) return;

    const rect = selectedImage.getBoundingClientRect();
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      direction: direction,
    };

    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!selectedImage || !resizeState.current.direction) return;

    const deltaX = e.clientX - resizeState.current.startX;
    const deltaY = e.clientY - resizeState.current.startY;
    const aspectRatio =
      resizeState.current.startHeight / resizeState.current.startWidth;
    let newWidth = resizeState.current.startWidth;
    let newHeight = resizeState.current.startHeight;

    // Determine new dimensions based on resize corner
    if (
      resizeState.current.direction === "se" ||
      resizeState.current.direction === "sw"
    ) {
      newWidth = Math.max(50, resizeState.current.startWidth + deltaX);
      newHeight = newWidth * aspectRatio;
    } else if (
      resizeState.current.direction === "ne" ||
      resizeState.current.direction === "nw"
    ) {
      newWidth = Math.max(50, resizeState.current.startWidth + deltaX);
      newHeight = newWidth * aspectRatio;
    }

    selectedImage.style.width = `${newWidth}px`;
    selectedImage.style.height = `${newHeight}px`;
    onChange(editorRef.current?.innerHTML || "");
  };

  const handleResizeEnd = () => {
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  // Click outside to deselect image
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectedImage &&
        !selectedImage.contains(e.target as Node) &&
        !editorRef.current?.contains(e.target as Node)
      ) {
        setSelectedImage(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [selectedImage]);

  const handleInput = () => {
    if (editorRef.current) {
      const cursorPosition = saveCursorPosition();
      setIsInternalUpdate(true);
      onChange(editorRef.current.innerHTML);
      requestAnimationFrame(() => {
        if (!mounted.current) return;
        restoreCursorPosition(cursorPosition);
        setIsInternalUpdate(false);
      });
    }
  };

  const handleSelectionChange = () => {
    updateFormatStates();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          applyFormat("bold");
          break;
        case "i":
          e.preventDefault();
          applyFormat("italic");
          break;
        case "u":
          e.preventDefault();
          applyFormat("underline");
          break;
        case "z":
          if (e.shiftKey) {
            e.preventDefault();
            applyFormat("redo");
          } else {
            e.preventDefault();
            applyFormat("undo");
          }
          break;
        case "y":
          e.preventDefault();
          applyFormat("redo");
          break;
      }
    }
  };

  useEffect(() => {
    if (
      !isInternalUpdate &&
      editorRef.current &&
      editorRef.current.innerHTML !== content
    ) {
      const cursorPosition = saveCursorPosition();
      editorRef.current.innerHTML = content;
      restoreCursorPosition(cursorPosition);
      attachImageHandlers();
    }
  }, [content, isInternalUpdate]);

  // Listen for selection changes to update toolbar state
  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Attach handlers when component mounts
  useEffect(() => {
    attachImageHandlers();
  }, []);

  return (
    <div className="col-span-3 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4 ">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Statement of Work
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Powered by Datamellon AI
            </p>
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
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {lastJobId && onDownloadDocx && (
                    <button
                      onClick={() => {
                        onDownloadDocx();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-green-700"
                    >
                      Download DOCX (from API)
                    </button>
                  )}
                  {lastJobId && onDownloadDocx && (
                    <div className="border-t border-gray-200 my-1" />
                  )}
                  <button
                    onClick={() => {
                      onExport("pdf");
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-black"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      onExport("word");
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-black"
                  >
                    Export as Word (Template)
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

      {/* Enhanced Toolbar */}
      {content && (
        <div className="border-b text-black border-gray-200 px-8 py-3 flex items-center gap-1 overflow-x-auto">
          {/* Undo/Redo */}
          <button
            onClick={() => applyFormat("undo")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("redo")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Text Formatting */}
          <button
            onClick={() => applyFormat("bold")}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              activeFormats.bold ? "bg-gray-200" : ""
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("italic")}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              activeFormats.italic ? "bg-gray-200" : ""
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("underline")}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              activeFormats.underline ? "bg-gray-200" : ""
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("strikeThrough")}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              activeFormats.strikeThrough ? "bg-gray-200" : ""
            }`}
            title="Strikethrough"
          >
            <span className="text-sm font-semibold line-through">S</span>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Text Color */}
          <div className="relative group">
            <button
              className="p-2 hover:bg-gray-100 rounded flex items-center gap-1"
              title="Text Color"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">▼</span>
            </button>
            <div className="hidden group-hover:flex absolute top-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 gap-1 z-10">
              <button
                onClick={() => changeTextColor("#000000")}
                className="w-6 h-6 bg-black rounded border hover:scale-110 transition-transform"
                title="Black"
              />
              <button
                onClick={() => changeTextColor("#EF4444")}
                className="w-6 h-6 bg-red-500 rounded border hover:scale-110 transition-transform"
                title="Red"
              />
              <button
                onClick={() => changeTextColor("#3B82F6")}
                className="w-6 h-6 bg-blue-500 rounded border hover:scale-110 transition-transform"
                title="Blue"
              />
              <button
                onClick={() => changeTextColor("#10B981")}
                className="w-6 h-6 bg-green-500 rounded border hover:scale-110 transition-transform"
                title="Green"
              />
              <button
                onClick={() => changeTextColor("#F59E0B")}
                className="w-6 h-6 bg-amber-500 rounded border hover:scale-110 transition-transform"
                title="Amber"
              />
              <button
                onClick={() => changeTextColor("#8B5CF6")}
                className="w-6 h-6 bg-purple-500 rounded border hover:scale-110 transition-transform"
                title="Purple"
              />
            </div>
          </div>

          {/* Highlight */}
          <div className="relative group">
            <button
              className="p-2 hover:bg-gray-100 rounded flex items-center gap-1"
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
              <span className="text-xs">▼</span>
            </button>
            <div className="hidden group-hover:flex absolute top-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 gap-1 z-30">
              <button
                onClick={() => changeHighlight("#FEF3C7")}
                className="w-6 h-6 bg-yellow-100 rounded border hover:scale-110 transition-transform"
                title="Yellow"
              />
              <button
                onClick={() => changeHighlight("#DBEAFE")}
                className="w-6 h-6 bg-blue-100 rounded border hover:scale-110 transition-transform"
                title="Blue"
              />
              <button
                onClick={() => changeHighlight("#D1FAE5")}
                className="w-6 h-6 bg-green-100 rounded border hover:scale-110 transition-transform"
                title="Green"
              />
              <button
                onClick={() => changeHighlight("#FCE7F3")}
                className="w-6 h-6 bg-pink-100 rounded border hover:scale-110 transition-transform"
                title="Pink"
              />
              <button
                onClick={() => changeHighlight("transparent")}
                className="w-6 h-6 bg-white rounded border hover:scale-110 transition-transform"
                title="Remove"
              />
            </div>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Lists */}
          <button
            onClick={() => applyFormat("insertUnorderedList")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("insertOrderedList")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Alignment */}
          <button
            onClick={() => applyFormat("justifyLeft")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("justifyCenter")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("justifyRight")}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Link */}
          <button
            onClick={insertLink}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>

          {/* Image */}
          <button
            onClick={insertImage}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Font Size */}
          <select
            onChange={(e) => changeFontSize(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            defaultValue="3"
            title="Font Size"
          >
            <option value="1">Small</option>
            <option value="2">Normal</option>
            <option value="3">Medium</option>
            <option value="4">Large</option>
            <option value="5">Extra Large</option>
          </select>

          {/* Heading Style */}
          <select
            onChange={(e) => {
              applyFormat("formatBlock", e.target.value);
              e.target.value = "p"; // Reset to default
            }}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Heading Style"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
        </div>
      )}

      {/* Main Content Area with Professional SOW Styling */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50 relative">
        {content ? (
          <>
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onPaste={onPaste}
              onKeyDown={handleKeyDown}
              onMouseUp={updateFormatStates}
              onKeyUp={updateFormatStates}
              suppressContentEditableWarning
              className="sow-document max-w-4xl mx-auto min-h-full p-12 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none text-gray-900"
              style={{ minHeight: "800px" }}
            />
            {selectedImage && (
              <div
                className="fixed pointer-events-none border-2 border-blue-500 bg-blue-50 bg-opacity-20"
                style={{
                  left: `${selectedImage.getBoundingClientRect().left}px`,
                  top: `${selectedImage.getBoundingClientRect().top}px`,
                  width: `${selectedImage.getBoundingClientRect().width}px`,
                  height: `${selectedImage.getBoundingClientRect().height}px`,
                  zIndex: 50,
                }}
              >
                {/* Resize handles */}
                <div
                  className="absolute w-3 h-3 bg-blue-500 cursor-se-resize pointer-events-auto bottom-0 right-0 transform translate-x-1.5 translate-y-1.5 rounded-full"
                  onMouseDown={(e) => handleResizeStart("se", e)}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 cursor-sw-resize pointer-events-auto bottom-0 left-0 transform -translate-x-1.5 translate-y-1.5 rounded-full"
                  onMouseDown={(e) => handleResizeStart("sw", e)}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 cursor-ne-resize pointer-events-auto top-0 right-0 transform translate-x-1.5 -translate-y-1.5 rounded-full"
                  onMouseDown={(e) => handleResizeStart("ne", e)}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 cursor-nw-resize pointer-events-auto top-0 left-0 transform -translate-x-1.5 -translate-y-1.5 rounded-full"
                  onMouseDown={(e) => handleResizeStart("nw", e)}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {/* Add SOW-specific styles */}
      <style jsx global>{`
        .sow-document {
          font-family: "Arial", "Helvetica", sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a1a;
        }

        /* Headers - matching Datamellon template */
        .sow-document h1 {
          font-size: 18pt;
          font-weight: bold;
          color: #000;
          margin-top: 24px;
          margin-bottom: 16px;
          page-break-after: avoid;
        }

        .sow-document h2 {
          font-size: 14pt;
          font-weight: bold;
          color: #000;
          margin-top: 18px;
          margin-bottom: 12px;
          page-break-after: avoid;
        }

        .sow-document h3 {
          font-size: 12pt;
          font-weight: bold;
          color: #000;
          margin-top: 14px;
          margin-bottom: 10px;
          page-break-after: avoid;
        }

        .sow-document h4 {
          font-size: 11pt;
          font-weight: bold;
          color: #000;
          margin-top: 12px;
          margin-bottom: 8px;
          page-break-after: avoid;
        }

        /* Paragraphs */
        .sow-document p {
          margin-bottom: 12px;
          text-align: justify;
        }

        /* Lists */
        .sow-document ul {
          margin-left: 40px;
          margin-bottom: 12px;
          list-style-type: disc;
          text-align: left;
        }

        .sow-document ol {
          margin-left: 40px;
          margin-bottom: 12px;
          list-style-type: decimal;
          text-align: left;
        }

        .sow-document li {
          margin-bottom: 6px;
          margin-left: 0;
          text-align: left;
        }

        /* Tables - professional formatting */
        .sow-document table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 10pt;
        }

        .sow-document table th {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 10px;
          font-weight: bold;
          text-align: left;
        }

        .sow-document table td {
          border: 1px solid #d1d5db;
          padding: 10px;
        }

        .sow-document table tr:nth-child(even) {
          background-color: #f9fafb;
        }

        /* Highlighted text (yellow marker) */
        .sow-document mark,
        .sow-document .highlight {
          background-color: #fef3c7;
          padding: 2px 0;
        }

        /* Strong/Bold */
        .sow-document strong,
        .sow-document b {
          font-weight: bold;
        }

        /* Emphasis/Italic */
        .sow-document em,
        .sow-document i {
          font-style: italic;
        }

        /* Underline */
        .sow-document u {
          text-decoration: underline;
        }

        /* Links */
        .sow-document a {
          color: #2563eb;
          text-decoration: underline;
        }

        .sow-document a:hover {
          color: #1d4ed8;
        }

        /* Blockquotes */
        .sow-document blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
          font-style: italic;
        }

        /* Code blocks (if needed) */
        .sow-document code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          font-size: 10pt;
        }

        .sow-document pre {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 16px 0;
        }

        .sow-document pre code {
          background: none;
          padding: 0;
        }

        /* Page breaks for printing */
        @media print {
          .sow-document h1,
          .sow-document h2,
          .sow-document h3 {
            page-break-after: avoid;
          }

          .sow-document table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-12 h-12 text-green-600" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Generate your professional SOW with AI
        </h2>

        <p className="text-gray-600 mb-8">
          Use the assistant on the right to get started. Upload context files or
          describe your project requirements.
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

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
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
