module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // endereço RPC do Ganache
      port: 7545,            // porta que aparece no Ganache
      network_id: "*"        // qualquer valor serve
    }
  },

  // Configuração do compilador Solidity
  compilers: {
    solc: {
      version: "0.8.19"      // escolha uma versão estável do Solidity
    }
  }
};