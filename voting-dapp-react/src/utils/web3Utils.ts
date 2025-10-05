export const LOCAL_RPC_URL = "http://127.0.0.1:7545";
// Ajuste conforme seu Ganache: 5777 (Truffle/Ganache antigo) ou 1337 (Ganache novo)
export const LOCAL_CHAIN_ID_DEC = 5777; // ou 1337

// CORRIGIDO: O valor hexadecimal deve ser prefixado apenas com "0x".
export const LOCAL_CHAIN_ID_HEX = "0x" + LOCAL_CHAIN_ID_DEC.toString(16);

export function shortAddress(addr?: string, size = 4) {
  if (!addr) return "";
  return addr.slice(0, 2 + size) + "..." + addr.slice(-size);
}

export const NETWORK_NAMES: Record<number, string> = {
  1: "Ethereum",
  5: "Goerli",
  11155111: "Sepolia",
  137: "Polygon",
  80001: "Mumbai",
  10: "OP Mainnet",
  420: "OP Goerli",
  8453: "Base",
  84531: "Base Goerli",
  42161: "Arbitrum One",
  421613: "Arbitrum Goerli",
  5777: "Ganache",
  1337: "Local",
};

export function networkName(chainId?: number) {
  if (!chainId) return "Desconhecida";
  return NETWORK_NAMES[chainId] || `Chain ${chainId}`;
}

