"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type FeedbackVariant = "success" | "error" | "info";

type FeedbackMessage = {
  id: string;
  title: string;
  description?: string;
  variant: FeedbackVariant;
};

type FeedbackInput = Omit<FeedbackMessage, "id">;

type FeedbackContextValue = {
  pushFeedback: (message: FeedbackInput) => void;
  clearFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const timersRef = useRef<number[]>([]);

  const removeFeedback = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const pushFeedback = useCallback(
    (message: FeedbackInput) => {
      const id = createId();
      setMessages((current) => [...current, { id, ...message }].slice(-3));
      const timer = window.setTimeout(() => removeFeedback(id), 3200);
      timersRef.current.push(timer);
    },
    [removeFeedback],
  );

  const clearFeedback = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setMessages([]);
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const value = useMemo(
    () => ({ pushFeedback, clearFeedback }),
    [pushFeedback, clearFeedback],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-4 right-4 z-70 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {messages.map((message) => {
          const variantClass =
            message.variant === "success"
              ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-50"
              : message.variant === "error"
                ? "border-red-500/30 bg-red-950/90 text-red-50"
                : "border-gold/30 bg-obsidian/95 text-sand";

          return (
            <div key={message.id} className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${variantClass}`}>
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] opacity-80">
                {message.variant}
              </div>
              <div className="mt-1 text-sm font-semibold">{message.title}</div>
              {message.description ? <div className="mt-1 text-xs leading-relaxed opacity-80">{message.description}</div> : null}
            </div>
          );
        })}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used inside FeedbackProvider");
  }
  return ctx;
}