import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CreatePage from "./page/create/CreatePage";
import UsePage from "./page/use/UsePage";
import Header from "./component/Header";
import CreatePage2 from "./page/create/CreatePage2";
import CreatePage3 from "./page/create/CreatePage3";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<CreatePage />}></Route>
        <Route path="/createPage2" element={<CreatePage2 />}></Route>
        <Route path="/createPage3" element={<CreatePage3 />}></Route>
        <Route path="/use" element={<UsePage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
