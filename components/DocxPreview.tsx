"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { Download, FileText } from "lucide-react";

interface DocxPreviewProps {
  docxBuffer: ArrayBuffer | null;
  isGenerating?: boolean;
  onDownloadDocx?: () => void;
  onExportPdf?: () => void;
  onDownloadWord?: () => void;
}

export default function DocxPreview({
  docxBuffer,
  isGenerating,
  onDownloadDocx,
  onExportPdf,
  onDownloadWord,
}: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const hasDocx = useMemo(() => !!docxBuffer, [docxBuffer]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setRenderError(null);
      const el = containerRef.current;
      if (!el || !docxBuffer) return;
      el.innerHTML = "";
      try {
        await renderAsync(docxBuffer, el, undefined, {
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
        });
      } catch (e) {
        if (cancelled) return;
        setRenderError(
          e instanceof Error ? e.message : "Failed to render DOCX",
        );
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [docxBuffer]);

  return (
    <div className="col-span-3 flex flex-col bg-white overflow-hidden">
      <div className="border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Statement of Work
            </h1>
            <p className="text-sm text-gray-500 mt-1">DOCX Preview</p>
          </div>

          <div className="flex items-center gap-2">
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                disabled={!hasDocx || !!isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  !hasDocx || isGenerating
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            )}

            {(onDownloadWord || onDownloadDocx) && (
              <button
                onClick={onDownloadWord || onDownloadDocx}
                disabled={!hasDocx || !!isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  !hasDocx || isGenerating
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Download className="w-4 h-4" />
                Download DOCX
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 ">
        {!hasDocx ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                No document yet
              </h2>
              <p className="text-gray-600">
                Fill the SOW wizard on the right and generate to preview the DOCX
                here.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {renderError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {renderError}
              </div>
            )}
            <div
              ref={containerRef}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 overflow-x-auto"
              style={{ maxWidth: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

