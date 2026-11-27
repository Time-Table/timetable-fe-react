import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { initAll } from "@amplitude/unified";

// Amplitude(2026-11-28). 키는 공개용 수집 키라 번들에 들어가도 되지만 저장소에는 두지 않는다(.env.local·배포 환경변수).
// 자동 수집과 세션 녹화는 끈다: 표 ID가 든 주소·표 제목·이름을 외부 도구로 보내지 않는 규칙(하네스 specs/metrics.md) 때문이다.
const amplitudeKey = process.env.REACT_APP_AMPLITUDE_API_KEY;
if (!amplitudeKey) {
  console.error("[amplitude] REACT_APP_AMPLITUDE_API_KEY is not set — no events will be sent");
} else {
  initAll(amplitudeKey, {
    serverZone: "US",
    analytics: { autocapture: false },
    sessionReplay: { sampleRate: 0 },
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
