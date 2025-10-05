import { useEffect, useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      const addr = await s.getAddress();
      setProvider(p);
      setSigner(s);
      setAccount(addr);

      window.ethereum.on?.("accountsChanged", async () => {
        const s2 = await p.getSigner();
        const addr2 = await s2.getAddress();
        setSigner(s2);
        setAccount(addr2);
      });

      window.ethereum.on?.("chainChanged", () => {
        // Força reload para evitar state inconsistente ao trocar de rede
        window.location.reload();
      });
    };
    init();
  }, []);

  return { provider, signer, account };
}