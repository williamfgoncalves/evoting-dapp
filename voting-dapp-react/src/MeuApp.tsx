// src/App.tsx

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { GlobalPage } from "./pages/GlobalPage";
import { VotePage } from "./pages/VotePage";
import { AdminPage } from "./pages/AdminPage";

// A linha abaixo com "export default" é essencial
export default function MeuApp() {
  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 16, padding: 12 }}>
        <Link to="/">Global</Link>
        <Link to="/admin">Gerenciamento</Link>
      </nav>
      <Routes>
        <Route path="/" element={<GlobalPage />} />
        <Route path="/vote/:address" element={<VotePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}