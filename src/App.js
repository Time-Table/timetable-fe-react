import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import UsePage from "./page/use/UsePage";
import Header from "./component/Header";
import CreatePage from "./page/create/CreatePage";
import ManagerPage from "./page/ManagerPage";
import AboutPage from "./page/AboutPage";
import NotFound from "./page/NotFound";
import Seo from "./Seo";

function App() {
  return (
    <Router>
      <Seo />
      <Header />
      <Routes>
        <Route path="/" element={<CreatePage />}></Route>
        <Route path="/managerPage" element={<ManagerPage />}></Route>
        <Route path="/create" element={<CreatePage />}></Route>
        <Route path="/table/:tableId" element={<UsePage />}></Route>
        <Route path="/about" element={<AboutPage />}></Route>
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
