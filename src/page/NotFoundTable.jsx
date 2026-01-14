import React from "react";
import theme from "../theme";
import styled from "@emotion/styled";
import Loader from "./use/component/Loading";

const NotFoundTable = () => {
  return (
    <CreatePageDiv>
      <h1>404 Error</h1>
      <h1>Table-Not Found</h1>
      <Loader />
      <h1>열심히 찾으러 다녔지만 테이블을 발견하지 못했습니다.</h1>

      <p>*요청하신 페이지는 존재하지 않거나 장기간 접근이 없어 지워졌을 수 있습니다.</p>
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

export default NotFoundTable;
