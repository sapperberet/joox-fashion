"use client";

import { useState } from "react";

type AlertType = "success" | "error" | "info";

interface AdminAlertProps {
  type: AlertType;
  message: string;
  dismissible?: boolean;
  icon?: string;
}

export default function AdminAlert({ type, message, dismissible = true, icon }: AdminAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const typeConfig = {
    success: {
      icon: "•",
      bgClass: "bg-emerald-950/70 border-emerald-500/40",
      textClass: "text-emerald-100",
      iconClass: "text-emerald-400",
    },
    error: {
      icon: "×",
      bgClass: "bg-red-950/70 border-red-500/40",
      textClass: "text-red-100",
      iconClass: "text-red-400",
    },
    info: {
      icon: "ⓘ",
      bgClass: "bg-blue-950/70 border-blue-500/40",
      textClass: "text-blue-100",
      iconClass: "text-blue-400",
    },
  };

  const config = typeConfig[type];
  const displayIcon = icon ?? config.icon;

  return (
    <div className={`rounded-2xl border flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4 ${config.bgClass} ${config.textClass}`}>
      <div className={`flex-shrink-0 font-bold text-lg ${config.iconClass} leading-none`}>
        {displayIcon}
      </div>
      <div className="flex-1 text-sm sm:text-base leading-relaxed">
        {message}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 text-lg font-bold leading-none hover:opacity-70 transition ${config.iconClass}`}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
