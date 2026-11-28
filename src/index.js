import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { init as initAmplitude } from "@amplitude/analytics-browser";
import { isAdmin } from "./utils/admin";

// Amplitude(2026-11-28). 키는 공개용 수집 키라 번들에 들어가도 되지만 저장소에는 두지 않는다(.env.local·배포 환경변수).
// 분석 SDK만 쓴다: 묶음 SDK(@amplitude/unified)의 Guides 플러그인이 페이지마다 주소·제목(표 ID·표 제목)을 붙인 기록을 보내서 뺐다.
// 자동 수집을 끄고 원격 설정도 받지 않는다: 표 ID가 든 주소·표 제목·이름을 외부 도구로 보내지 않는 규칙(하네스 specs/metrics.md) 때문이다.
// 관리자 브라우저는 초기화하지 않는다(GA·Clarity와 같음). 이벤트는 utils/analytics.js의 trackEvent가 보낸다.
const amplitudeKey = process.env.REACT_APP_AMPLITUDE_API_KEY;
if (!amplitudeKey) {
  console.error("[amplitude] REACT_APP_AMPLITUDE_API_KEY is not set — no events will be sent");
} else if (!isAdmin()) {
  initAmplitude(amplitudeKey, {
    serverZone: "US",
    autocapture: false,
    remoteConfig: { fetchRemoteConfig: false },
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
