const ElectionFactory = artifacts.require("ElectionFactory");

module.exports = async function (deployer) {
  await deployer.deploy(ElectionFactory);
};