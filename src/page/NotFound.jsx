import React from "react";
import theme from "../theme";
import styled from "@emotion/styled";
import Loader from "./use/component/Loading";

const NotFound = () => {
  return (
    <CreatePageDiv>
      <h1>404 Error</h1>
      <Loader />
      <h1>열심히 찾아봤지만 발견하지 못했습니다.</h1>

      <p>*요청하신 페이지는 존재하지 않거나 장기간 접근이 없어 지워졌을 수 있습니다.</p>
    </CreatePageDiv>
  );
};

const CreatePageDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  margin: 50px;
`;

export default NotFound;
