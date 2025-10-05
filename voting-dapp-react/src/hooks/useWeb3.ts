import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { LOCAL_CHAIN_ID_HEX, LOCAL_RPC_URL } from "../utils/web3Utils";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Efeito 1: Roda apenas uma vez para inicializar o provider e pegar o estado inicial.
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);

      try {
        const net = await p.getNetwork();
        setChainId(Number(net.chainId));

        const accs: string[] = await window.ethereum.request({ method: "eth_accounts" });
        if (accs && accs.length > 0) {
          const s = await p.getSigner();
          setSigner(s);
          setAccount(accs[0]);
        }
      } catch (err) {
        console.error("Falha ao inicializar automaticamente:", err);
      }
    };
    init();
  }, []); // A array de dependências vazia [] garante que isso rode apenas uma vez.

  // Efeito 2: Roda sempre que o `provider` mudar para registrar os eventos.
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = async (accs: string[]) => {
      setAccount(accs?.[0] || "");
      if (accs?.length > 0) {
        const s = await provider.getSigner();
        setSigner(s);
      } else {
        setSigner(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);
    window.ethereum?.on("chainChanged", handleChainChanged);

    // Função de limpeza para remover os listeners
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider]); // Este efeito depende do provider.

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask não detectado.");
    setLoading(true);
    try {
      // O provider já pode existir, mas recriamos para garantir a consistência
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      const addr = await s.getAddress();
      const net = await p.getNetwork();
      setProvider(p);
      setSigner(s);
      setAccount(addr);
      setChainId(Number(net.chainId));
    } finally {
      setLoading(false);
    }
  }, []);

  const switchToLocalNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask não detectado.");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: LOCAL_CHAIN_ID_HEX,
              chainName: "Ganache Local",
              rpcUrls: [LOCAL_RPC_URL],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  return { provider, signer, account, chainId, loading, connectWallet, switchToLocalNetwork };
}