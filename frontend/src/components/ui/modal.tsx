import { PropsWithChildren, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
}

export const Modal = ({
  open,
  onClose,
  title,
  description,
  className,
  children
}: ModalProps) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 backdrop-blur-sm" style={{ backgroundColor: "var(--overlay-bg)" }}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className={cn("surface relative z-10 w-full max-w-3xl", className)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/90 px-6 py-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{title}</h2>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};
