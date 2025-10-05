import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useWeb3 } from "../hooks/useWeb3";
import { fetchAllElections, fetchElectionDetails, fetchResults } from "../services/elections";

dayjs.extend(relativeTime);

type ElectionItem = {
  address: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  options: string[];
  isOpen: boolean;
  hasEnded: boolean;
};

export function GlobalPage() {
  const { provider } = useWeb3();
  const [items, setItems] = useState<ElectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);

  async function load() {
    if (!provider) return;
    setLoading(true);
    const addrs = await fetchAllElections(provider);
    const details = await Promise.all(addrs.map(addr => fetchElectionDetails(provider, addr)));
    setItems(details);
    setLoading(false);
    lastFetchRef.current = Date.now();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Listener de bloco para atualização leve (no máx a cada 10s para evitar excesso)
  useEffect(() => {
    if (!provider) return;
    const handler = async () => {
      if (Date.now() - lastFetchRef.current > 10_000) {
        await load();
      }
    };
    provider.on("block", handler);
    return () => {
      provider.off?.("block", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const sorted = useMemo(() => {
    // Ordena: Em andamento (end asc), À iniciar (start asc), Encerradas (end desc)
    const live = items.filter(i => i.isOpen).sort((a, b) => a.endTime - b.endTime);
    const future = items.filter(i => !i.isOpen && !i.hasEnded).sort((a, b) => a.startTime - b.startTime);
    const past = items.filter(i => i.hasEnded).sort((a, b) => b.endTime - a.endTime);
    return [...live, ...future, ...past];
  }, [items]);

  if (!provider) return <div style={{ padding: 16 }}>Conecte o MetaMask.</div>;
  if (loading) return <div style={{ padding: 16 }}>Carregando eleições...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Eleições</h2>
      {sorted.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "#666", border: "1px dashed #ddd", borderRadius: 8 }}>
          Nenhuma eleição criada ainda.
          <div style={{ marginTop: 8 }}>
            <Link to="/admin">Criar primeira eleição</Link>
          </div>
        </div>
      )}
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {sorted.map((e) => (
          <li key={e.address} style={{ marginBottom: 16, border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>{e.name}</div>
            <div style={{ margin: "4px 0 8px", color: "#555" }}>{e.description}</div>
            <div style={{ fontSize: 13, color: "#666" }}>
              {dayjs.unix(e.startTime).format("YYYY-MM-DD HH:mm")} → {dayjs.unix(e.endTime).format("YYYY-MM-DD HH:mm")}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge item={e} />
            </div>

            {!e.hasEnded && (
              <div style={{ marginTop: 8 }}>
                <Link to={`/vote/${e.address}`}>Votar</Link>
              </div>
            )}
            {e.hasEnded && <ResultsBlock address={e.address} options={e.options} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ item }: { item: ElectionItem }) {
  const now = dayjs();
  const start = dayjs.unix(item.startTime);
  const end = dayjs.unix(item.endTime);

  if (item.isOpen) {
    const remain = end.diff(now, "second");
    return (
      <span style={{ background: "#e6f7ff", color: "#096dd9", padding: "2px 8px", borderRadius: 12 }}>
        Em andamento — termina em {formatDuration(remain)}
      </span>
    );
  }
  if (item.hasEnded) {
    return (
      <span style={{ background: "#f6ffed", color: "#389e0d", padding: "2px 8px", borderRadius: 12 }}>
        Encerrada {end.fromNow()}
      </span>
    );
  }
  const untilStart = start.diff(now, "second");
  return (
    <span style={{ background: "#fffbe6", color: "#d48806", padding: "2px 8px", borderRadius: 12 }}>
      À iniciar — começa em {formatDuration(untilStart)}
    </span>
  );
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m || h) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function ResultsBlock({ address, options }: { address: string; options: string[] }) {
  const { provider } = useWeb3();
  const [results, setResults] = useState<number[] | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!provider) return;
      try {
        const r = await fetchResults(provider, address);
        setResults(r);
      } catch {
        setResults(null); // reverte antes do fim
      }
    };
    run();
  }, [provider, address]);

  if (!results) return <div style={{ marginTop: 8 }}>Resultados disponíveis após o fim.</div>;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 600 }}>Resultados</div>
      <ul>
        {options.map((opt, i) => (
          <li key={i}>{opt}: {results[i]}</li>
        ))}
      </ul>
    </div>
  );
}