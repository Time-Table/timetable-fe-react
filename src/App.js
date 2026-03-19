import "./App.css";
import { Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import TimetablePage from "./page/timetable/TimetablePage";
import Header from "./component/Header";
import CreatePage from "./page/create/CreatePage.jsx";
import QuickCreatePage from "./page/create/QuickCreatePage.jsx";
import ManagerPage from "./page/ManagerPage";
import AboutPage from "./page/AboutPage";
import GuidePage from "./page/GuidePage";
import NotFound from "./page/NotFound";
import Seo from "./Seo";
import { HelmetProvider } from "react-helmet-async";
import TermsPage from "./page/TermsPage";
import PrivacyPage from "./page/PrivacyPage";
import BlogListPage from "./page/blog/BlogListPage";
import BlogDetailPage from "./page/blog/BlogDetailPage";
import Footer from "./component/Footer";
import ScrollToTop from "./component/ScrollToTop";

function ConditionalFooter() {
     const location = useLocation();
     const hideFooterPaths = ["/quick-create"];
     if (hideFooterPaths.includes(location.pathname)) return null;
     return <Footer />;
}

function App() {
     return (
          <HelmetProvider>
               <Router>
                    <ScrollToTop />
                    <Seo />
                    <Header />
                    <Routes>
                         <Route path="/" element={<CreatePage />}></Route>
                         <Route path="/create" element={<CreatePage />}></Route>
                         <Route path="/quick-create" element={<QuickCreatePage />}></Route>
                         <Route path="/managerPage" element={<ManagerPage />}></Route>
                         <Route path="/table/:tableId" element={<TimetablePage />}></Route>
                         <Route path="/about" element={<AboutPage />}></Route>
                         <Route path="/guide" element={<GuidePage />}></Route>
                         <Route path="/terms" element={<TermsPage />}></Route>
                         <Route path="/privacy" element={<PrivacyPage />}></Route>
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
