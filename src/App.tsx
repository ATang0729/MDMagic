import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Extract from "@/pages/Extract";
import Convert from "@/pages/Convert";
import Rules from "@/pages/Rules";
import History from "@/pages/History";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/extract" element={<Extract />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}
