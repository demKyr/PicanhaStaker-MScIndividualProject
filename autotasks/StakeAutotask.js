const ABI = [`function indirectStake() external nonReentrant`];

const ADDRESS = '0x9437eff6E8713CF1619D9507695489a6639b758d';

const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

async function main(signer) {
  const contract = new ethers.Contract(ADDRESS, ABI, signer);
  const tx = await contract.indirectStake();
  console.log('Indirect stake transaction sent:', tx.hash);
}

// Entrypoint for the Autotask
exports.handler = async function(params) {
  const provider = new DefenderRelayProvider(params);
  const signer = new DefenderRelaySigner(params, provider, { speed: 'average' });
  console.log(`Using relayer ${await signer.getAddress()}`);
  await main(signer);
}