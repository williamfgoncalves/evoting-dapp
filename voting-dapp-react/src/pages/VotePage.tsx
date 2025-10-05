// src/pages/VotePage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useWeb3 } from "../hooks/useWeb3";
import { fetchElectionDetails, getElection, voteOnce } from "../services/elections";

export function VotePage() {
  const { address } = useParams<{ address: string }>();
  const { provider, signer, account } = useWeb3();
  const navigate = useNavigate();
  const [details, setDetails] = useState<any | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!provider || !address) return;
      const d = await fetchElectionDetails(provider, address);
      setDetails(d);

      const contract = getElection(address, provider);
      const hv = await contract.hasVoted(account);
      setHasVoted(hv);
    };
    run();
  }, [provider, address, account]);

  if (!provider) return <div>Conecte o MetaMask.</div>;
  if (!details) return <div>Carregando eleição...</div>;

  const canVote = details.isOpen && !hasVoted;

  const onSubmit = async () => {
    if (!signer || selected === null || !address) return;
    setSubmitting(true);
    setError("");
    try {
      await voteOnce(signer, address, selected);
      setHasVoted(true);
      alert("Voto computado!");
      navigate("/");
    } catch (e: any) {
      setError(e?.reason || e?.message || "Falha ao votar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>{details.name}</h2>
      <div>{details.description}</div>
      <div>
        {dayjs.unix(details.startTime).format("YYYY-MM-DD HH:mm")} → {dayjs.unix(details.endTime).format("YYYY-MM-DD HH:mm")}
      </div>
      <div>Status: {details.hasEnded ? "Encerrada" : details.isOpen ? "Em andamento" : "À iniciar"}</div>
      <h3>Opções</h3>
      <ul>
        {details.options.map((opt: string, i: number) => (
          <li key={i}>
            <label>
              <input
                type="radio"
                name="option"
                value={i}
                checked={selected === i}
                onChange={() => setSelected(i)}
                disabled={!canVote || submitting}
              />
              {opt}
            </label>
          </li>
        ))}
      </ul>

      {hasVoted && <div>Você já votou nesta eleição.</div>}
      {!details.isOpen && !details.hasEnded && <div>A votação ainda não começou.</div>}
      {details.hasEnded && <div>A votação se encerrou.</div>}

      <button onClick={onSubmit} disabled={!canVote || selected === null || submitting}>
        {submitting ? "Enviando..." : "Votar"}
      </button>

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}