import "./App.css";
import { Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import TimetablePage from "./page/timetable/TimetablePage";
import Header from "./component/Header";
import CreatePage from "./page/create/CreatePage.jsx";
import QuickCreatePage from "./page/create/QuickCreatePage.jsx";
import ManagerPage from "./page/ManagerPage";
import AboutPage from "./page/AboutPage";
import GuidePage from "./page/GuidePage";
import GuideSchedulingPage from "./page/GuideSchedulingPage";
import StartPage from "./page/start/StartPage";
import NotFound from "./page/NotFound";
import { HelmetProvider } from "react-helmet-async";
import TermsPage from "./page/TermsPage";
import PrivacyPage from "./page/PrivacyPage";
import ContactPage from "./page/ContactPage";
import BlogListPage from "./page/blog/BlogListPage";
import BlogDetailPage from "./page/blog/BlogDetailPage";
import Footer from "./component/Footer";
import ScrollToTop from "./component/ScrollToTop";
import Seo from "./Seo";

// 관리자 콘솔은 자체 사이드바로 화면 전체를 쓰기 때문에
// 서비스용 헤더/푸터가 끼면 레이아웃이 깨진다.
// 라우터는 대소문자를 가리지 않아 /managerpage 로도 같은 화면이 열린다. 비교도 그렇게 한다.
const CHROME_FREE_PATHS = ["/managerpage"];

function useHidesSiteChrome() {
     const location = useLocation();
     return CHROME_FREE_PATHS.includes(location.pathname.toLowerCase());
}

function ConditionalHeader() {
     return useHidesSiteChrome() ? null : <Header />;
}

function ConditionalFooter() {
     const location = useLocation();
     const hideFooterPaths = ["/quick-create", ...CHROME_FREE_PATHS];
     if (hideFooterPaths.includes(location.pathname.toLowerCase())) return null;
     return <Footer />;
}

function App() {
     return (
          <HelmetProvider>
               <Router>
                    <ScrollToTop />
                    <Seo />
                    <ConditionalHeader />
                    <Routes>
                         <Route path="/" element={<CreatePage />}></Route>
                         <Route path="/create" element={<CreatePage />}></Route>
                         <Route path="/quick-create" element={<QuickCreatePage />}></Route>
                         <Route path="/managerPage" element={<ManagerPage />}></Route>
                         <Route path="/table/:tableId" element={<TimetablePage />}></Route>
                         <Route path="/about" element={<AboutPage />}></Route>
                         <Route path="/guide" element={<GuidePage />}></Route>
                         <Route path="/start" element={<StartPage />}></Route>
                         <Route
                              path="/appointment-scheduling-guide"
                              element={<GuideSchedulingPage />}
                         ></Route>
                         <Route path="/terms" element={<TermsPage />}></Route>
                         <Route path="/privacy" element={<PrivacyPage />}></Route>
                         <Route path="/contact" element={<ContactPage />}></Route>
                         <Route path="/blog" element={<BlogListPage />}></Route>
                         <Route path="/blog/:id" element={<BlogDetailPage />}></Route>
                         <Route path="*" element={<NotFound />}></Route>
                    </Routes>
                    <ConditionalFooter />
               </Router>
          </HelmetProvider>
     );
}

export default App;
