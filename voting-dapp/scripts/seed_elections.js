// scripts/seed_elections.js
const { BN, time } = require("@openzeppelin/test-helpers");
const ElectionFactory = artifacts.require("ElectionFactory");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const creator = accounts[0]; // usaremos a primeira conta como criador
    const factory = await ElectionFactory.deployed();

    const now = await time.latest();

    // Helper para criar eleição
    async function createElection(name, description, startsInSec, durationSec, options) {
      const startTime = now.add(new BN(startsInSec));
      const endTime = startTime.add(new BN(durationSec));
      const tx = await factory.createElection(
        name,
        description,
        startTime,
        endTime,
        options,
        false, // isMultipleChoice (MVP: false)
        1,     // maxChoices (MVP: 1)
        false, // isCommitReveal (MVP: false)
        { from: creator }
      );
      const addr = tx.logs[0].args.electionAddress;
      console.log(`- ${name} criada em ${addr} | ${new Date(startTime.toNumber()*1000).toISOString()} -> ${new Date(endTime.toNumber()*1000).toISOString()}`);
      return addr;
    }

    console.log("Seminando eleições de exemplo...");

    // 1) Eleição em andamento (começa em 30s, dura 1h)
    await createElection(
      "Eleição Municipal 2025",
      "Escolha o representante municipal.",
      30,     // começa em 30s
      3600,   // dura 1h
      ["Candidata Ana", "Candidato Bruno", "Candidata Carla"]
    );

    // 2) Plebiscito futuro (começa em 5 min, dura 30 min)
    await createElection(
      "Plebiscito: Nova Praça",
      "Aprova a construção da nova praça central?",
      300,    // 5 min
      1800,   // 30 min
      ["Sim", "Não"]
    );

    // 3) Eleição já encerrada (começou -2h, durou 1h, já acabou)
    const startPast = now.sub(new BN(7200)); // 2h atrás
    const endPast = startPast.add(new BN(3600)); // terminou há 1h
    const txPast = await factory.createElection(
      "Conselho Escolar 2024",
      "Eleição de representantes do conselho escolar.",
      startPast,
      endPast,
      ["Chapa 1", "Chapa 2", "Chapa 3"],
      false,
      1,
      false,
      { from: creator }
    );
    const pastAddr = txPast.logs[0].args.electionAddress;
    console.log(`- Conselho Escolar 2024 criada em ${pastAddr} | ENCERRADA`);

    const all = await factory.getElections();
    console.log(`Total de eleições na Factory: ${all.length}`);

    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};