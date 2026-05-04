"use client";

import { useEffect, useState } from "react";
import {
  buildNaverMapsSdkUrl,
  NAVER_MAPS_SCRIPT_ID,
  type NaverMapsStatus,
} from "./naver-maps";

function hasNaverMaps(): boolean {
  return typeof window !== "undefined" && Boolean(window.naver?.maps?.Map);
}

export function useNaverMapsSdk(clientId: string): NaverMapsStatus {
  const [status, setStatus] = useState<NaverMapsStatus>(() =>
    typeof window !== "undefined" && hasNaverMaps() ? "ready" : "idle",
  );

  useEffect(() => {
    if (hasNaverMaps()) {
      setStatus("ready");
      return;
    }

    const existingScript = document.getElementById(NAVER_MAPS_SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    const script = existingScript ?? document.createElement("script");
    let cancelled = false;

    function handleLoad() {
      if (!cancelled) setStatus(hasNaverMaps() ? "ready" : "error");
    }

    function handleError() {
      if (!cancelled) setStatus("error");
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
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [clientId]);

  return status;
}
