import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useState, useContext, useRef } from "react";

import ContractsContext from "../../store/contract-context";
import StakeModel from "../../components/stake-components/stake-model";
import UserInfoModel from "../../components/user-info-components/user-info-model";

function StakePage() {
  const { activate, active, library: provider } = useWeb3React();
  const contractsCtx = useContext(ContractsContext);

  async function handleIndirectStake(amount) {
    if (active) {
      try {
        console.log("Indirect Stake:", parseFloat(amount));
        // Your logic for handling indirect stake
        // For example, you can call a contract function for indirect stake
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  async function handleDirectStake(amount) {
    if (active) {
      try {
        console.log("Direct Stake:", parseFloat(amount));
        // Your logic for handling direct stake
        // For example, you can call a contract function for direct stake
      } catch (error) {
        console.log(error);
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

// let initialAccInt = parseInt(initialAcc * 100000);
// let NumOfCaptions = 100;
// const labelsArray = labels.split(",");
// await contractsCtx.contracts["staker"].addModel(
//   name,
//   description,
//   NumOfVotes,
//   NumOfCaptions,
//   initialAccInt,
//   labelsArray,
//   {
//     value: ethers.utils.parseEther(ModelCost),
//   }
// );