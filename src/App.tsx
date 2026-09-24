import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Hat from "./components/Hat";
import Project from "./components/Project";
import ScrollToTop from "./ScrollToTop";

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hat/:hatId" element={<Hat />} />
        <Route path="/project/:projectId" element={<Project />} />
      </Routes>
    </HashRouter>
  );
}
