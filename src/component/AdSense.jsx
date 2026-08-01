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
          ads.forEach((ad) => {
            const width = ad.closest(".adsense-wrap")?.getBoundingClientRect().width || 0;
            if (width > 0) {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
          });
        }
      } catch (e) {
        // console.error("AdSense error:", e);
      }
    }, 1500); // 딜레이를 더 늘려 SPA 콘텐츠가 충분히 로드된 후 노출 유도

    return () => clearTimeout(timer);
  }, [slot, isReady]);

  if (!isReady) return null;

  return (
    <div
      className="adsense-wrap"
      style={{
        margin: "40px auto",
        maxWidth: "800px",
        width: "100%",
        textAlign: "center",
      }}
    >
      <div
        className="adsense-container"
        style={{
          margin: "10px 0",
          textAlign: "center",
          overflow: "hidden",
          minHeight: "100px",
          background: "rgba(0,0,0,0.01)",
          borderRadius: "16px",
          clear: "both",
          padding: "20px 0",
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
      <p style={{ fontSize: "12px", color: "#ccc", marginTop: "8px", fontFamily: "Pretendard-Regular" }}>
        타임테이블의 무료 서비스 유지를 위해 광고가 노출될 수 있습니다.
        개인정보를 수집하지 않으며, 효율적인 일정 관리를 돕는 도구입니다.
      </p>
    </div>
  );
};

export default AdSense;
