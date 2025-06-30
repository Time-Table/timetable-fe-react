import React from "react";
import { Helmet } from "react-helmet-async";

const Seo = ({
  title = "타임테이블",
  description = "팀 일정 조율이 더 쉬워집니다. 최적의 시간을 찾아보세요.",
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
