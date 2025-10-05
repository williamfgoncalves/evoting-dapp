// src/pages/GlobalPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useWeb3 } from "../hooks/useWeb3";
import { fetchAllElections, fetchElectionDetails, fetchResults } from "../services/elections";

export function GlobalPage() {
  const { provider } = useWeb3();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!provider) return;
      const addrs = await fetchAllElections(provider);
      const details = await Promise.all(addrs.map(addr => fetchElectionDetails(provider, addr)));
      setItems(details);
      setLoading(false);
    };
    run();
  }, [provider]);

  if (!provider) return <div>Conecte o MetaMask.</div>;
  if (loading) return <div>Carregando eleições...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Eleições</h2>
      {items.length === 0 && <div>Nenhuma eleição criada.</div>}
      <ul>
        {items.map((e) => (
          <li key={e.address} style={{ marginBottom: 12 }}>
            <div><strong>{e.name}</strong></div>
            <div>{e.description}</div>
            <div>
              {dayjs.unix(e.startTime).format("YYYY-MM-DD HH:mm")} → {dayjs.unix(e.endTime).format("YYYY-MM-DD HH:mm")}
            </div>
            <div>
              Status: {e.hasEnded ? "Encerrada" : e.isOpen ? "Em andamento" : "À iniciar"}
            </div>
            {!e.hasEnded && <Link to={`/vote/${e.address}`}>Votar</Link>}
            {e.hasEnded && (
              <ResultsBlock address={e.address} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultsBlock({ address }: { address: string }) {
  const { provider } = useWeb3();
  const [results, setResults] = useState<number[] | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!provider) return;
      const d = await fetchElectionDetails(provider, address);
      setOptions(d.options);
      try {
        const r = await fetchResults(provider, address);
        setResults(r);
      } catch {
        setResults(null);
      }
    };
    run();
  }, [provider, address]);

  if (!results) return <div>Resultados disponíveis após o fim.</div>;

  return (
    <div>
      <div><strong>Resultados</strong></div>
      <ul>
        {options.map((opt, i) => (
          <li key={i}>{opt}: {results[i]}</li>
        ))}
      </ul>
    </div>
  );
}