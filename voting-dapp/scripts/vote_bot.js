// scripts/vote_bot.js
const ElectionFactory = artifacts.require("ElectionFactory");
const Election = artifacts.require("Election");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length < 4) {
      console.log("Precisa de pelo menos 4 contas no Ganache para a demonstração.");
      return callback();
    }

    // Carrega a factory do último deploy conhecido pelo Truffle
    const factory = await ElectionFactory.deployed();

    const electionAddrs = await factory.getElections();
    if (electionAddrs.length === 0) {
      console.log("Nenhuma eleição encontrada na Factory. Crie algumas primeiro.");
      return callback();
    }

    console.log(`Encontradas ${electionAddrs.length} eleições. Iniciando vote bot...`);

    let totalVotesSent = 0;
    for (let i = 0; i < electionAddrs.length; i++) {
      const addr = electionAddrs[i];
      const el = await Election.at(addr);

      const name = await el.name();
      const isOpen = await el.isOpen();
      const hasEnded = await el.hasEnded();
      const options = await el.getOptions();

      console.log(`\n[${i + 1}/${electionAddrs.length}] ${name} @ ${addr}`);
      console.log(`- Status: ${isOpen ? "Em andamento" : hasEnded ? "Encerrada" : "À iniciar"}`);
      console.log(`- Opções: ${options.join(", ")}`);

      if (!isOpen) {
        console.log("- Pulando (não está aberta).");
        continue;
      }

      // Envia alguns votos de 5 contas (ou menos se quiser)
      const voters = accounts.slice(1, 6); // evita a primeira conta se preferir
      let votesForThisElection = 0;

      for (let v = 0; v < voters.length; v++) {
        const voter = voters[v];

        // Alterna opção: v % options.length
        const optionIndex = Math.floor(Math.random() * options.length);

        try {
          const already = await el.hasVoted(voter);
          if (already) {
            console.log(`  - ${short(voter)} já votou. Pulando.`);
            continue;
          }

          const tx = await el.vote(optionIndex, { from: voter });
          const evt = tx.logs.find((l) => l.event === "Voted");
          const opt = options[optionIndex];
          console.log(`  ✓ ${short(voter)} votou em "${opt}" (idx ${optionIndex}) tx: ${tx.tx}`);
          votesForThisElection++;
          totalVotesSent++;
        } catch (e) {
          const msg = (e && (e.reason || e.message)) || "Erro ao votar";
          console.log(`  x Falha ao votar com ${short(voter)}: ${msg}`);
        }
      }

      console.log(`- Votos enviados nesta eleição: ${votesForThisElection}`);
    }

    console.log(`\nVote bot finalizado. Total de votos enviados: ${totalVotesSent}`);
    return callback();
  } catch (err) {
    console.error(err);
    return callback(err);
  }
};

function short(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}