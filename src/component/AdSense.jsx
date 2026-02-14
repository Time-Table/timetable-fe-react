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
}) => {
  useEffect(() => {
    let timer = setTimeout(() => {
      try {
        if (window.adsbygoogle) {
          const ads = document.querySelectorAll(".adsbygoogle:not([data-adsbygoogle-status])");
          if (ads.length > 0) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [slot]);

  return (
    <div
      style={{
        margin: "30px 0",
        textAlign: "center",
        overflow: "hidden",
        minHeight: "100px",
        background: "rgba(0,0,0,0.01)",
        borderRadius: "8px",
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
