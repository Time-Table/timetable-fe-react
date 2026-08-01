import React from "react";
import theme from "../theme";
import styled from "@emotion/styled";
import Loader from "./timetable/components/Loading";
import Seo from "../Seo";

const NotFound = () => {
  return (
    <CreatePageDiv>
      {/* SPA라 404도 HTTP 200으로 나간다. 색인되면 소프트 404가 쌓인다. */}
      <Seo title="페이지를 찾을 수 없습니다 - 타임테이블" noindex />
      <h1>404 Error</h1>
      <Loader />
      <h1>열심히 돌았지만 페이지를 발견하지 못했습니다.</h1>
      <p>*요청하신 페이지는 존재하지 않습니다.</p>
    </CreatePageDiv>
  );
};

const CreatePageDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  padding: 50px 20px;
  box-sizing: border-box;
  text-align: center;
`;

export default NotFound;
