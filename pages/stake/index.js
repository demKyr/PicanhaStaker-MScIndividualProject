import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

import StakeModel from "../../components/stake-components/stake-model";
import UserInfoModel from "../../components/stake-components/stake-user-info-model";
import { stakerAbi } from "../../constants/staker-abi";
import { maticGoerliAbi } from "../../constants/matic-goerli-abi";
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
            gasLimit: 2_000_000
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
            gasLimit: 2_000_000
          });
      } catch (error) {
        console.error("Error in direct deposit:", error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  async function handleApprove(amount) {
    if (active) {
      const signerAddr = await signer.getAddress();
      const stakingTokenContract = new ethers.Contract(contractAddresses["maticGoerli"], maticGoerliAbi, signer);
      try {
        const tx = await stakingTokenContract.approve(
          contractAddresses["staker"], 
          ethers.utils.parseEther(amount), 
          { 
            from: signerAddr,
            gasLimit: 200_000
          });
      } catch (error) {
        console.error("Error in approval:", error);
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
      <StakeModel onIndirectStake={handleIndirectStake} onDirectStake={handleDirectStake} onApprove={handleApprove}/>
    </div>
  );
}

export default StakePage;