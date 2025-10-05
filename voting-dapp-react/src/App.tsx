import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { GlobalPage } from "./pages/GlobalPage";
import { VotePage } from "./pages/VotePage";
import { AdminPage } from "./pages/AdminPage";
import { useWeb3 } from "./hooks/useWeb3";
import { Toaster } from "react-hot-toast";

function Header() {
  const { provider, account } = useWeb3();
  const [network, setNetwork] = React.useState<string>("");

  React.useEffect(() => {
    const run = async () => {
      if (!provider) return;
      const net = await provider.getNetwork();
      setNetwork(`${net.name || "dev"} (${Number(net.chainId)})`);
    };
    run();
  }, [provider]);

  const short = account ? account.slice(0, 6) + "..." + account.slice(-4) : "";

  return (
    <div style={{ display: "flex", gap: 16, padding: 12, borderBottom: "1px solid #ddd", alignItems: "center" }}>
      <Link to="/">Global</Link>
      <Link to="/admin">Gerenciamento</Link>
      <div style={{ marginLeft: "auto", color: "#555" }}>
        {network && <span style={{ marginRight: 12 }}>Rede: {network}</span>}
        {short && <span>Conta: {short}</span>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<GlobalPage />} />
          <Route path="/vote/:address" element={<VotePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}