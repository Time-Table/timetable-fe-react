import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import UsePage from "./page/use/UsePage";
import Header from "./component/Header";
import CreatePage from "./page/create/CreatePage";
import LandingPage from "./page/LandingPage";
import AboutPage from "./page/AboutPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<CreatePage />}></Route>
        <Route path="/LandingPage" element={<LandingPage />}></Route>
        <Route path="/createPage" element={<CreatePage />}></Route>
        <Route path="/table/:tableId" element={<UsePage />}></Route>
        <Route path="/about" element={<AboutPage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
