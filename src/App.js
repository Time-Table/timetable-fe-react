import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CreatePage from "./page/create/CreatePage";
import UsePage from "./page/use/UsePage";
import Header from "./component/Header";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<CreatePage />}></Route>
        <Route path="/use" element={<UsePage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
