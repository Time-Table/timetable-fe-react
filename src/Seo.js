import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";

const Seo = ({
  title = "타임테이블",
  description = "소,대규모 모임 - 인원 별 시간 정리",
  url = "https://www.timetable2.com/",
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    {/* {image && <meta property="og:image" content={image} />} */}
  </Helmet>
);

export default Seo;
