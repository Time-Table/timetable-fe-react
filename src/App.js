import "./App.css";
import { Suspense } from "react";
import { Route, BrowserRouter as Router, Routes, Navigate, useLocation } from "react-router-dom";
import TimetablePage from "./page/timetable/TimetablePage";
import Header from "./component/Header";
import QuickCreatePage from "./page/create/QuickCreatePage.jsx";
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
import ServiceJsonLd from "./component/ServiceJsonLd";
import { lazyPage, LazyPageBoundary } from "./utils/lazyPage";

// 방문이 드물고 무거운 화면은 첫 로딩 번들에서 빼고 들어갈 때 받는다.
// AboutPage는 큰 SVG 그림 4개(원본 약 1MB)를 품고 있어 모든 페이지의 첫 로딩을 늦추고 있었다.
// ManagerPage는 관리자 전용이다.
const AboutPage = lazyPage(() => import("./page/AboutPage"));
const ManagerPage = lazyPage(() => import("./page/ManagerPage"));

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

function PageBoundary({ children }) {
     return <LazyPageBoundary resetKey={useLocation().pathname}>{children}</LazyPageBoundary>;
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
                    {/* 서비스 스키마. 컴포넌트가 스스로 정본 랜딩("/")에서만 렌더한다. */}
                    <ServiceJsonLd />
                    <ConditionalHeader />
                    <PageBoundary>
                    {/* 떼어 둔 화면을 받는 동안 자리를 잡아 둔다. 비워 두면 푸터가 헤더 밑으로 올라왔다 내려간다. */}
                    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
                    <Routes>
                         <Route path="/" element={<StartPage />}></Route>
                         {/* 옛 랜딩 주소. 색인과 외부 링크가 남아 있어 404 대신 정본으로 보낸다.
                             크롤러용 301은 public/_redirects 가 담당한다. */}
                         <Route path="/create" element={<Navigate to="/" replace />}></Route>
                         <Route path="/start" element={<Navigate to="/" replace />}></Route>
                         <Route path="/quick-create" element={<QuickCreatePage />}></Route>
                         <Route path="/managerPage" element={<ManagerPage />}></Route>
                         <Route path="/table/:tableId" element={<TimetablePage />}></Route>
                         <Route path="/about" element={<AboutPage />}></Route>
                         <Route path="/guide" element={<GuidePage />}></Route>
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
                    </Suspense>
                    </PageBoundary>
                    <ConditionalFooter />
               </Router>
          </HelmetProvider>
     );
}

export default App;
