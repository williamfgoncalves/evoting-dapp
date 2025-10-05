export function HelpPage() {
  return (
    <div style={{ padding: 16, lineHeight: 1.5 }}>
      <h2>Ajuda: MetaMask e Rede Local</h2>
      <ol>
        <li>Instale a extensão MetaMask no seu navegador.</li>
        <li>Abra a MetaMask e clique em “Adicionar rede”.</li>
        <li>Use:
          <ul>
            <li>Nome: Ganache Local</li>
            <li>RPC URL: http://127.0.0.1:7545</li>
            <li>Chain ID: 5777 (ou 1337)</li>
            <li>Moeda: ETH</li>
          </ul>
        </li>
        <li>Volte à DApp e clique em “Conectar Carteira”.</li>
        <li>Se necessário, clique em “Trocar para Ganache”.</li>
      </ol>
    </div>
  );
}