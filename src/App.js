import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import UsePage from "./page/use/UsePage";
import Header from "./component/Header";
import CreatePage from "./page/create/CreatePage.jsx";
import NormalCreatePage from "./page/create/NormalCreatePage.jsx";
import QuickCreatePage from "./page/create/QuickCreatePage.jsx";
import ManagerPage from "./page/ManagerPage";
import AboutPage from "./page/AboutPage";
import NotFound from "./page/NotFound";
import Seo from "./Seo";
import { HelmetProvider } from "react-helmet-async";
import TermsPage from "./page/TermsPage";
import PrivacyPage from "./page/PrivacyPage";

function App() {
     return (
          <HelmetProvider>
               <Router>
                    <Seo />
                    <Header />
                    <Routes>
                         <Route path="/" element={<CreatePage />}></Route>
                         <Route path="/create" element={<CreatePage />}></Route>
                         <Route path="/create/normal" element={<NormalCreatePage />}></Route>
                         <Route path="/quick-create" element={<QuickCreatePage />}></Route>
                         <Route path="/managerPage" element={<ManagerPage />}></Route>
                         <Route path="/table/:tableId" element={<UsePage />}></Route>
                         <Route path="/about" element={<AboutPage />}></Route>
                         <Route path="/terms" element={<TermsPage />}></Route>
                         <Route path="/privacy" element={<PrivacyPage />}></Route>
                         <Route path="*" element={<NotFound />}></Route>
                    </Routes>
               </Router>
          </HelmetProvider>
     );
}

export default App;
