"use client";

import { useEffect, useState } from "react";
import {
  buildNaverMapsSdkUrl,
  NAVER_MAPS_SCRIPT_ID,
  type NaverMapsStatus,
} from "./naver-maps";

const SCRIPT_STATUS_KEY = "naverMapsStatus";
const SCRIPT_STATUS_READY = "ready";
const SCRIPT_STATUS_ERROR = "error";
const AUTH_VALIDATION_INTERVAL_MS = 200;
const AUTH_VALIDATION_ATTEMPTS = 5;

function hasNaverMaps(): boolean {
  return typeof window !== "undefined" && Boolean(window.naver?.maps?.Map);
}

function shouldSkipLocalhostSdk(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST === "true") return false;
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function useNaverMapsSdk(clientId: string): NaverMapsStatus {
  const [status, setStatus] = useState<NaverMapsStatus>(() =>
    typeof window !== "undefined" && hasNaverMaps() ? "ready" : "idle",
  );

  useEffect(() => {
    if (shouldSkipLocalhostSdk()) {
      setStatus("error");
      return;
    }

    if (hasNaverMaps()) {
      setStatus("ready");
      return;
    }

    const existingScript = document.getElementById(NAVER_MAPS_SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    const script = existingScript ?? document.createElement("script");
    let cancelled = false;
    let validationIntervalId: number | null = null;

    function clearValidationInterval() {
      if (validationIntervalId === null) return;
      window.clearInterval(validationIntervalId);
      validationIntervalId = null;
    }

    function markReady() {
      script.dataset[SCRIPT_STATUS_KEY] = SCRIPT_STATUS_READY;
      if (!cancelled) setStatus("ready");
    }

    function markError() {
      script.dataset[SCRIPT_STATUS_KEY] = SCRIPT_STATUS_ERROR;
      if (!cancelled) setStatus("error");
    }

    function validateAuthAfterLoad() {
      let attempts = 0;
      clearValidationInterval();
      validationIntervalId = window.setInterval(() => {
        attempts += 1;

        if (!hasNaverMaps()) {
          clearValidationInterval();
          markError();
          return;
        }

        if (attempts >= AUTH_VALIDATION_ATTEMPTS) {
          clearValidationInterval();
          markReady();
        }
      }, AUTH_VALIDATION_INTERVAL_MS);
    }

    function handleLoad() {
      if (!hasNaverMaps()) {
        markError();
        return;
      }
      validateAuthAfterLoad();
    }

    function handleError() {
      markError();
    }

    if (existingScript?.dataset[SCRIPT_STATUS_KEY] === SCRIPT_STATUS_READY) {
      setStatus(hasNaverMaps() ? "ready" : "error");
      return;
    }

    if (existingScript?.dataset[SCRIPT_STATUS_KEY] === SCRIPT_STATUS_ERROR) {
      setStatus("error");
      return;
    }

    if (existingScript && window.naver?.maps && !hasNaverMaps()) {
      existingScript.dataset[SCRIPT_STATUS_KEY] = SCRIPT_STATUS_ERROR;
      setStatus("error");
      return;
    }

    setStatus("loading");
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (!existingScript) {
      script.id = NAVER_MAPS_SCRIPT_ID;
      script.async = true;
      script.src = buildNaverMapsSdkUrl(clientId);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      clearValidationInterval();
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [clientId]);

  return status;
}
