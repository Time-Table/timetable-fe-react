import styled from "@emotion/styled/macro";
import Button from "../../../component/Button";
import theme from "../../../theme";
import Swal from "sweetalert2";
import { GrShareOption } from "react-icons/gr";
import { AnimatePresence, motion } from "framer-motion";

export default function InviteSection({ tableId, title }) {
     const tableUrl = `${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`;

     const copyToClipboard = () => {
          navigator.clipboard.writeText(tableUrl).then(() => {
               const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    customClass: {
                         popup: "custom-swal-popup",
                         title: "custom-swal-title",
                    },
               });
               Toast.fire({
                    icon: "success",
                    iconColor: `${theme.color.button.blue}`,
                    title: "링크를 복사했습니다!",
               });
          });
     };

     return (
          <AnimatePresence>
               <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Header>
                         <GrShareOption size={28} color={theme.color.button.blue} />
                         <HeaderText>친구 초대하기</HeaderText>
                    </Header>
                    <TitleDiv>
                         <span style={{ fontFamily: "Pretendard-Bold" }}>{title}</span>
                         <span style={{ color: theme.text.gamma[500] }}> 테이블에 친구를 초대하세요.</span>
                    </TitleDiv>
                    <UrlDiv>{tableUrl}</UrlDiv>
                    <Button title="링크 복사" variant="secondary" onClick={copyToClipboard} />
               </Frame>
          </AnimatePresence>
     );
}

const Frame = styled(motion.div)`
     width: 100%;
     display: flex;
     flex-direction: column;
     gap: 24px;
     background-color: white;
     border-radius: 16px;
     padding: 30px;
     box-sizing: border-box;
     box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
     display: flex;
     align-items: center;
     gap: 12px;
`;

const HeaderText = styled.h2`
     font-family: "Pretendard-Bold";
     font-size: 24px;
     color: ${theme.text.gamma[200]};
     margin: 0;
`;

const TitleDiv = styled.div`
     font-size: 18px;
     font-family: Pretendard-Regular;
     color: ${theme.text.gamma[200]};
     text-align: center;
     word-break: keep-all;
`;

const UrlDiv = styled.div`
     ${theme.styles.flexCenterRow}
     background-color: ${theme.text.gamma[950]};
     font-family: Pretendard-Regular;
     font-size: 15px;
     color: ${theme.text.gamma[400]};
     width: 100%;
     height: 50px;
     border-radius: 10px;
     padding: 8px 16px;
     box-sizing: border-box;
     border: 1px solid ${theme.text.gamma[900]};
     word-break: break-all;
     text-align: center;

     @media (max-width: 480px) {
          font-size: 13px;
     }
`;