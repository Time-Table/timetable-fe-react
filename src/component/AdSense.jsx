import React, { useEffect } from "react";

/**
 * Google AdSense Component
 * @param {string} slot - The ad slot ID from your AdSense dashboard
 * @param {object} style - Custom styling for the ad container
 * @param {string} format - Ad format (auto, fluid, etc.)
 * @param {string} responsive - Whether the ad is responsive (true/false)
 */
const AdSense = ({
  slot = "2480057478",
  style = { display: "block" },
  format = "auto",
  responsive = "true",
  layout = "",
  isReady = true, // 콘텐츠 준비 여부 확인용 추가
}) => {
  useEffect(() => {
    if (!isReady) return;

    let timer = setTimeout(() => {
      try {
        if (window.adsbygoogle) {
          const ads = document.querySelectorAll(".adsbygoogle:not([data-adsbygoogle-status])");
          if (ads.length > 0) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }
      } catch (e) {
        // console.error("AdSense error:", e);
      }
    }, 500); // 딜레이를 약간 늘려 콘텐츠 로드 후 노출 유도

    return () => clearTimeout(timer);
  }, [slot, isReady]);

  if (!isReady) return null;

  return (
    <div
      className="adsense-container"
      style={{
        margin: "40px 0",
        textAlign: "center",
        overflow: "hidden",
        minHeight: "100px",
        background: "rgba(0,0,0,0.02)",
        borderRadius: "12px",
        clear: "both",
      }}
    >
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-7558566935889139"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        data-ad-layout={layout}
      />
    </div>
  );
};

export default AdSense;
