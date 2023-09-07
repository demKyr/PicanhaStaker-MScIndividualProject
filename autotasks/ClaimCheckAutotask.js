const ABI = [    {
    "inputs": [],
    "name": "latestUnbondingNonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_unbondNonce",
        "type": "uint256"
      }
    ],
    "name": "isClaimable",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_unbondNonce",
        "type": "uint256"
      }
    ],
    "name": "indirectUnstakeClaim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
  ];
  
  const ADDRESS = '0x9437eff6E8713CF1619D9507695489a6639b758d';
  
  const { ethers } = require("ethers");
  const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');
  
  async function main(signer) {
    const contract = new ethers.Contract(ADDRESS, ABI, signer);
    let tx;
    let UnbondingNonce = await contract.latestUnbondingNonce();
    let isClaimable = await contract.isClaimable(UnbondingNonce);
    console.log(UnbondingNonce, "isClaimable:", isClaimable);
    while (isClaimable) {
      tx = await contract.indirectUnstakeClaim(UnbondingNonce, { gasLimit: 2000000 });
      console.log('Indirect stake claimed:', tx.hash);
      UnbondingNonce = UnbondingNonce - 1;
      isClaimable = await contract.isClaimable(UnbondingNonce);
      console.log(UnbondingNonce, "isClaimable:", isClaimable);
    }
  }
  
  // Entrypoint for the Autotask
  exports.handler = async function(params) {
    const provider = new DefenderRelayProvider(params);
    const signer = new DefenderRelaySigner(params, provider, { speed: 'average' });
    console.log(`Using relayer ${await signer.getAddress()}`);
    await main(signer);
  }