import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import UsePage from "./page/use/UsePage";
import Header from "./component/Header";
import CreatePage from "./page/create/CreatePage";
import LandingPage from "./page/LandingPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route path="/createPage" element={<CreatePage />}></Route>
        <Route path="/use" element={<UsePage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
