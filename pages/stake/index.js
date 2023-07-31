import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

import StakeModel from "../../components/stake-components/stake-model";
import UserInfoModel from "../../components/user-info-components/user-info-model";
import { stakerAbi } from "../../constants/staker-abi";
import { contractAddresses } from "../../constants/contract-address";

function StakePage() {
  const { activate, active, library: provider } = useWeb3React();
  const signer = provider.getSigner();

  async function handleIndirectStake(amount) {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        const tx = await contract.indirectDeposit(
          ethers.utils.parseEther(amount), 
          signerAddr, 
          { 
            from: signerAddr,
            gasLimit: 200000
          });
      } catch (error) {
        console.error("Error in indirect deposit:", error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  async function handleDirectStake(amount) {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        const tx = await contract.directDeposit(
          ethers.utils.parseEther(amount), 
          signerAddr, 
          { 
            from: signerAddr,
            gasLimit: 200000
          });
      } catch (error) {
        console.error("Error in direct deposit:", error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  return (
    <div>
      <h1 className="instruction">Stake</h1>
      <UserInfoModel />
      <StakeModel onIndirectStake={handleIndirectStake} onDirectStake={handleDirectStake} />
    </div>
  );
}

export default StakePage;