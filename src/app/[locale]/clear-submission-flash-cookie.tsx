"use client";

import { useEffect, useTransition } from "react";
import { clearSubmissionFlashCookieAction } from "./actions";

export function ClearSubmissionFlashCookie() {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      void clearSubmissionFlashCookieAction();
    });
  }, [startTransition]);

  return null;
}
