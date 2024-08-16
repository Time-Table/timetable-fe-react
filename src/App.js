import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/test")
      .then((response) => {
        setData(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.error("에러 ", error);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>
          <h1>API Data</h1>
          {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>로딩</p>}
        </div>
      </header>
    </div>
  );
}

export default App;
