import "./App.css";
import SignUp from "./SignUp";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Sidebar from "./Sidebar";
import Home from "./Home";
import PrivateRoute from "./PrivateRoute"; // Import PrivateRoute
import Group from "./Group";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/sidebar" element={<Sidebar />}></Route>
        <Route path="/group" element={<Group />}></Route>
        <Route path="/home"element={<PrivateRoute><Home /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
