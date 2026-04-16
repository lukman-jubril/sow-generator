"use client";

import React, { createContext, useContext, useCallback, useState } from "react";

type ToastOptions = { message: string; type?: "success" | "error" | "info" };

const ToastContext = createContext<
  { showToast: (opts: ToastOptions) => void } | undefined
>(undefined);
const ModalContext = createContext<
  | {
      prompt: (label: string, defaultValue?: string) => Promise<string | null>;
    }
  | undefined
>(undefined);

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const [modalState, setModalState] = useState<{
    label: string;
    defaultValue?: string;
    resolve?: (v: string | null) => void;
  } | null>(null);

  const showToast = useCallback((opts: ToastOptions) => {
    setToasts((s) => [...s, opts]);
    setTimeout(() => setToasts((s) => s.slice(1)), 4000);
  }, []);

  const prompt = useCallback((label: string, defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setModalState({ label, defaultValue, resolve });
    });
  }, []);

  const handleModalConfirm = (value: string) => {
    modalState?.resolve?.(value);
    setModalState(null);
  };

  const handleModalCancel = () => {
    modalState?.resolve?.(null);
    setModalState(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ModalContext.Provider value={{ prompt }}>
        {children}

        {/* Toast container */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          {toasts.map((t, i) => (
            <div
              key={i}
              className={`px-4 py-2 rounded shadow-lg text-white max-w-xs break-words ${
                t.type === "error"
                  ? "bg-red-600"
                  : t.type === "success"
                    ? "bg-green-600"
                    : "bg-gray-800"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>

        {/* Modal prompt */}
        {modalState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={handleModalCancel}
            />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {modalState.label}
              </h3>
              <input
                autoFocus
                defaultValue={modalState.defaultValue}
                id="ui-prompt-input"
                className="w-full border rounded px-3 py-2 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-3 py-2 rounded bg-gray-100"
                  onClick={handleModalCancel}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded bg-green-600 text-white"
                  onClick={() => {
                    const el = document.getElementById(
                      "ui-prompt-input",
                    ) as HTMLInputElement | null;
                    handleModalConfirm(el?.value ?? "");
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalContext.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within UiProvider");
  return ctx;
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within UiProvider");
  return ctx;
};

export default UiProvider;
