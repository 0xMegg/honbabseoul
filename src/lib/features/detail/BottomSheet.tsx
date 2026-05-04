"use client";

import type { ReactNode } from "react";

type BottomSheetProps = {
  children: ReactNode;
  closeLabel: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function BottomSheet({ children, closeLabel, onClose, open, title }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-5xl px-3 pb-3 md:px-8">
      <section
        aria-label={title}
        aria-modal="false"
        className="max-h-[70vh] overflow-y-auto rounded-md border border-border bg-bg p-4 shadow-xl"
        role="dialog"
      >
        <div className="mb-3 flex items-center justify-end">
          <button
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold"
            onClick={onClose}
            type="button"
          >
            {closeLabel}
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
