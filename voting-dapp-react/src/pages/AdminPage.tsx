import { useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
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

  const addOption = () => {
    const v = optionInput.trim();
    if (!v) return;
    setOptions((o) => [...o, v]);
    setOptionInput("");
  };

  const removeOption = (idx: number) => {
    setOptions((o) => o.filter((_, i) => i !== idx));
  };

  const onSubmit = async () => {
    if (!signer) return toast.error("Conecte o MetaMask.");
    try {
      const startTs = dayjs(start).unix();
      const endTs = dayjs(end).unix();

      if (!name.trim()) throw new Error("Informe o nome da eleição.");
      if (options.length < 2) throw new Error("Informe pelo menos 2 opções.");
      if (!start || !end) throw new Error("Informe início e fim.");
      if (!(endTs > startTs)) throw new Error("Janela de votação inválida.");

      setSubmitting(true);
      toast.loading("Criando eleição...", { id: "create" });
      await createElection(signer, {
        name: name.trim(),
        description: desc.trim(),
        startTime: startTs,
        endTime: endTs,
        options,
      });
      toast.success("Eleição criada!", { id: "create" });

      setName(""); setDesc(""); setStart(""); setEnd(""); setOptions([]);
    } catch (e: any) {
      toast.error(e?.reason || e?.message || "Falha ao criar eleição.", { id: "create" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Gerenciamento</h2>

      <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <div>
          <label>Nome</label><br />
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Descrição</label><br />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: "100%", minHeight: 80 }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Início</label><br />
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Fim</label><br />
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>

        <div>
          <label>Opções</label><br />
          <div style={{ display: "flex", gap: 8 }}>
            <input value={optionInput} onChange={(e) => setOptionInput(e.target.value)} style={{ flex: 1 }} />
            <button onClick={addOption}>Adicionar</button>
          </div>
          <ul>
            {options.map((o, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{o}</span>
                <button onClick={() => removeOption(i)} style={{ marginLeft: "auto" }}>Remover</button>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={onSubmit} disabled={submitting}>
          {submitting ? "Criando..." : "Criar Eleição"}
        </button>
      </div>
    </div>
  );
}