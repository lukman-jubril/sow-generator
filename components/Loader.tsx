import React from "react";

interface LoaderProps {
  status?: string | null;
}

const Loader = ({ status }: LoaderProps) => {
  const displayStatus = status || "Generating SOW";
  const steps = [
    { key: "start", label: "Start request" },
    { key: "queue", label: "Queued" },
    { key: "run", label: "Generating content" },
    { key: "render", label: "Preparing document" },
  ] as const;

  const activeStep =
    displayStatus.toLowerCase().includes("start") ? 0 :
    displayStatus.toLowerCase().includes("queue") ? 1 :
    displayStatus.toLowerCase().includes("run") ? 2 :
    displayStatus.toLowerCase().includes("render") ? 3 :
    1;

  const progressPct = Math.max(10, Math.min(95, (activeStep / 3) * 100));
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-16 absolute bg-black/50 z-50">
      <div className="w-[520px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-transparent border-l-green-500 animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {displayStatus}
            </p>
            <p className="text-xs text-gray-500">This may take 2–15 minutes</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {steps.map((s, idx) => {
            const isDone = idx < activeStep;
            const isActive = idx === activeStep;
            return (
              <div
                key={s.key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  isDone
                    ? "border-green-200 bg-green-50"
                    : isActive
                      ? "border-green-300 bg-white"
                      : "border-gray-200 bg-white"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDone
                      ? "bg-green-600"
                      : isActive
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-300"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isDone
                      ? "text-green-800"
                      : isActive
                        ? "text-gray-900"
                        : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[11px] text-gray-500">
          Tip: Keep this tab open while the document is being generated.
        </div>
      </div>
    </div>
  );
};

export default Loader;