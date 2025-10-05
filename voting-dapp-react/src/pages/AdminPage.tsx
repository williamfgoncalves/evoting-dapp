// src/pages/AdminPage.tsx
import { useState } from "react";
import dayjs from "dayjs";
import { useWeb3 } from "../hooks/useWeb3";
import { createElection } from "../services/elections";

export function AdminPage() {
  const { signer } = useWeb3();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState(""); // "2025-10-05T12:00"
  const [end, setEnd] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const addOption = () => {
    const v = optionInput.trim();
    if (!v) return;
    setOptions((o) => [...o, v]);
    setOptionInput("");
  };

  const onSubmit = async () => {
    if (!signer) {
      setMsg("Conecte o MetaMask.");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      const startTs = dayjs(start).unix();
      const endTs = dayjs(end).unix();
      if (!name || options.length < 2) throw new Error("Informe nome e pelo menos 2 opções.");
      if (!(endTs > startTs)) throw new Error("Janela de votação inválida.");

      await createElection(signer, {
        name,
        description: desc,
        startTime: startTs,
        endTime: endTs,
        options,
      });
      setMsg("Eleição criada com sucesso!");
      setName(""); setDesc(""); setStart(""); setEnd(""); setOptions([]);
    } catch (e: any) {
      setMsg(e?.reason || e?.message || "Falha ao criar eleição.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Gerenciamento</h2>
      <div>
        <div>
          <label>Nome</label><br />
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>Descrição</label><br />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <label>Início</label><br />
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label>Fim</label><br />
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label>Opções</label><br />
          <input value={optionInput} onChange={(e) => setOptionInput(e.target.value)} />
          <button onClick={addOption}>Adicionar</button>
          <ul>
            {options.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
        <button onClick={onSubmit} disabled={submitting}>
          {submitting ? "Criando..." : "Criar Eleição"}
        </button>
        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      </div>
    </div>
  );
}