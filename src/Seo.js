import React, { useEffect } from "react";

const Seo = ({
  title = "타임테이블",
  description = "팀 일정 조율이 더 쉬워집니다. 최적의 시간을 찾아보세요.",
  url = "https://www.timetable2.com/",
}) => {
  useEffect(() => {
    if (title) document.querySelector('meta[property="og:title"]').setAttribute("content", title);
    if (description)
      document
        .querySelector('meta[property="og:description"]')
        .setAttribute("content", description);
    if (url) document.querySelector('meta[property="og:url"]').setAttribute("content", url);
    // if (image) document.querySelector('meta[property="og:image"]').setAttribute("content", image);
  }, [title, description, url]);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
};

export default Seo;
