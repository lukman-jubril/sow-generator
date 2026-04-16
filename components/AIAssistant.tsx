"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Message } from "@/types";
import type { GenerateSowRequest } from "@/lib/sowApi";

interface AIAssistantProps {
  messages: Message[];
  onGenerateSow: (payload: GenerateSowRequest) => void;
  isGenerating?: boolean;
}

export default function AIAssistant({
  messages,
  onGenerateSow,
  isGenerating,
}: AIAssistantProps) {
  const [showSowForm, setShowSowForm] = useState(true);
  const [sowStep, setSowStep] = useState<1 | 2 | 3 | 4>(1);
  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [awsServices, setAwsServices] = useState("");
  const [timelineWeeks, setTimelineWeeks] = useState<number>(4);
  const [sponsorName, setSponsorName] = useState("TBD");
  const [sponsorTitle, setSponsorTitle] = useState("TBD");
  const [sponsorEmail, setSponsorEmail] = useState("TBD");
  const [contextText, setContextText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stepLabels = ["Basics", "Stakeholders", "Context", "Review"] as const;

  const canGoNext = useMemo(() => {
    if (sowStep === 1) {
      return (
        clientName.trim().length > 0 &&
        projectTitle.trim().length > 0 &&
        projectDescription.trim().length > 0
      );
    }
    if (sowStep === 2) {
      return awsServices.trim().length > 0 && timelineWeeks > 0;
    }
    if (sowStep === 3) {
      return contextText.trim().length > 0;
    }
    return true;
  }, [
    sowStep,
    clientName,
    projectTitle,
    projectDescription,
    awsServices,
    timelineWeeks,
    contextText,
  ]);

  const canGenerate = useMemo(() => {
    return (
      clientName.trim().length > 0 &&
      projectTitle.trim().length > 0 &&
      projectDescription.trim().length > 0 &&
      awsServices.trim().length > 0 &&
      Number.isFinite(timelineWeeks) &&
      timelineWeeks > 0 &&
      contextText.trim().length > 0
    );
  }, [
    clientName,
    projectTitle,
    projectDescription,
    awsServices,
    timelineWeeks,
    contextText,
  ]);

  const handleGenerate = () => {
    if (!canGenerate || isGenerating) return;
    const payload: GenerateSowRequest = {
      client_name: clientName.trim(),
      project_title: projectTitle.trim(),
      project_description: projectDescription.trim(),
      aws_services: awsServices.trim(),
      timeline_weeks: timelineWeeks,
      sponsor_name: sponsorName.trim() || "TBD",
      sponsor_title: sponsorTitle.trim() || "TBD",
      sponsor_email: sponsorEmail.trim() || "TBD",
      context_text: contextText.trim(),
    };
    onGenerateSow(payload);
  };

  const handleNextStep = () => {
    if (!canGoNext) return;
    setSowStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  };

  const handlePrevStep = () => {
    setSowStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="col-span-1 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
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
        {/* SOW Details Form */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowSowForm((v) => !v)}
            className="w-full flex items-center justify-between text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">
              SOW Details
            </span>
            <span className="text-xs text-gray-500">
              {showSowForm ? "Hide" : "Show"}
            </span>
          </button>

          {showSowForm && (
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 space-y-3">
              {/* Progress indicator */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  {stepLabels.map((label, idx) => {
                    const stepNumber = (idx + 1) as 1 | 2 | 3 | 4;
                    const isActive = sowStep === stepNumber;
                    const isDone = sowStep > stepNumber;
                    return (
                      <div
                        key={label}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                            isDone
                              ? "bg-green-600 text-white border-green-600"
                              : isActive
                                ? "bg-green-50 text-green-700 border-green-600"
                                : "bg-white text-gray-500 border-gray-300"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={`mt-1 text-[10px] ${
                            isActive ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${((sowStep - 1) / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step content */}
              {sowStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Client name
                    </label>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. Acme Fintech"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Project title
                    </label>
                    <input
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. AI-Powered Fraud Detection System"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Project description
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={4}
                      placeholder="Briefly describe the project goals and scope."
                    />
                  </div>
                </div>
              )}

              {sowStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Timeline (weeks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={timelineWeeks}
                        onChange={(e) =>
                          setTimelineWeeks(
                            Number.isFinite(Number(e.target.value))
                              ? Number(e.target.value)
                              : 0,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        AWS services
                      </label>
                      <input
                        value={awsServices}
                        onChange={(e) => setAwsServices(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g. Bedrock, S3, Lambda, OpenSearch"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        Comma-separated is fine.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sponsor name
                      </label>
                      <input
                        value={sponsorName}
                        onChange={(e) => setSponsorName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="TBD"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sponsor title
                      </label>
                      <input
                        value={sponsorTitle}
                        onChange={(e) => setSponsorTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="TBD"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sponsor email
                      </label>
                      <input
                        value={sponsorEmail}
                        onChange={(e) => setSponsorEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="TBD"
                      />
                    </div>
                  </div>
                </div>
              )}

              {sowStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Context / requirements
                    </label>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={8}
                      placeholder="Paste requirements, constraints, assumptions, success criteria, etc."
                    />
                  </div>
                </div>
              )}

              {sowStep === 4 && (
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">Client</span>
                      <span className="font-medium text-gray-900 text-right">
                        {clientName || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">Project</span>
                      <span className="font-medium text-gray-900 text-right">
                        {projectTitle || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">Timeline</span>
                      <span className="font-medium text-gray-900 text-right">
                        {timelineWeeks ? `${timelineWeeks} weeks` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">AWS services</span>
                      <span className="font-medium text-gray-900 text-right">
                        {awsServices || "—"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Context preview
                      </p>
                      <p className="text-xs whitespace-pre-wrap line-clamp-4">
                        {contextText || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate || !!isGenerating}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !canGenerate || isGenerating
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {isGenerating ? "Generating..." : "Generate SOW"}
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={sowStep === 1 || !!isGenerating}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    sowStep === 1 || isGenerating
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={sowStep === 4 || !canGoNext || !!isGenerating}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sowStep === 4 || !canGoNext || isGenerating
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Next
                </button>
              </div>

              {!canGoNext && sowStep !== 4 && (
                <p className="text-[11px] text-gray-500">
                  Complete the required fields to continue.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
