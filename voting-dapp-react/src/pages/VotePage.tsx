import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
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

  useEffect(() => {
    const run = async () => {
      if (!provider || !address) return;
      const d = await fetchElectionDetails(provider, address);
      setDetails(d);

      if (account) {
        const contract = getElection(address, provider);
        const hv = await contract.hasVoted(account);
        setHasVoted(hv);
      }
    };
    run();
  }, [provider, address, account]);

  if (!provider) return <div style={{ padding: 16 }}>Conecte o MetaMask.</div>;
  if (!details) return <div style={{ padding: 16 }}>Carregando eleição...</div>;

  const canVote = details.isOpen && !hasVoted;

  const onSubmit = async () => {
    if (!signer) return toast.error("Conecte o MetaMask.");
    if (selected === null) return toast.error("Selecione uma opção.");
    if (!address) return;

    setSubmitting(true);
    toast.loading("Enviando voto...", { id: "vote" });
    try {
      await voteOnce(signer, address, selected);
      toast.success("Voto computado!", { id: "vote" });
      setHasVoted(true);
      navigate("/");
    } catch (e: any) {
      toast.error(e?.reason || e?.message || "Falha ao votar", { id: "vote" });
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

      <h3 style={{ marginTop: 12 }}>Opções</h3>
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
    </div>
  );
}