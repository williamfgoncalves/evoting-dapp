import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { GlobalPage } from "./pages/GlobalPage";
import { VotePage } from "./pages/VotePage";
import { AdminPage } from "./pages/AdminPage";
import { HelpPage } from "./pages/HelpPage";
import { useWeb3 } from "./hooks/useWeb3";
import { shortAddress, networkName } from "./utils/web3Utils";
import { Toaster, toast } from "react-hot-toast";

function Header() {
  const { provider, account, chainId, loading, connectWallet, switchToLocalNetwork } = useWeb3();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Carteira conectada!");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao conectar carteira.");
    }
  };

  const onSwitch = async () => {
    try {
      await switchToLocalNetwork();
      toast.success("Rede alternada para Ganache.");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao trocar de rede.");
    }
  };

  return (
    <div style={{ display: "flex", gap: 16, padding: 12, borderBottom: "1px solid #ddd", alignItems: "center" }}>
      <Link to="/">Global</Link>
      <Link to="/admin">Gerenciamento</Link>
      <Link to="/ajuda">Ajuda</Link>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#666" }}>
          Rede: {chainId ? networkName(chainId) : provider ? "Detectando..." : "MetaMask não detectado"}
        </span>
        {!account ? (
          <button onClick={onConnect} disabled={loading} style={{ padding: "6px 10px" }}>
            {loading ? "Conectando..." : "Conectar Carteira"}
          </button>
        ) : (
          <span style={{ background: "#f5f5f5", padding: "4px 8px", borderRadius: 8 }}>{shortAddress(account)}</span>
        )}
        <button onClick={onSwitch} style={{ padding: "6px 10px" }}>
          Trocar para Ganache
        </button>
      </div>
    </div>
  );
}

function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { provider, chainId } = useWeb3();
  // Se não há provider, peça para instalar/abrir MetaMask
  if (!provider) {
    return (
      <div style={{ padding: 16 }}>
        <h3>MetaMask não detectado</h3>
        <p>Instale a extensão e recarregue a página. Em seguida clique em “Conectar Carteira”.</p>
        <p>Download: https://metamask.io</p>
      </div>
    );
  }
  // Se chainId não é a local, incentive o switch (mas não bloqueie totalmente a UI)
  if (chainId !== 5777 && chainId !== 1337) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Rede incorreta</h3>
        <p>Por favor, troque para a rede local (Ganache). Clique em “Trocar para Ganache” no topo.</p>
        {children}
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <NetworkGuard>
          <Routes>
            <Route path="/" element={<GlobalPage />} />
            <Route path="/vote/:address" element={<VotePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/ajuda" element={<HelpPage />} />
          </Routes>
        </NetworkGuard>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}