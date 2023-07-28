import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useState, useContext, useRef } from "react";

import ContractsContext from "../../store/contract-context";
import StakeModel from "../../components/stake-components/stake-model";
import { ModelCost } from "../../constants/parameters";

function StakePage() {
  const { activate, active, library: provider } = useWeb3React();
  const contractsCtx = useContext(ContractsContext);

  async function StakeModelHandler(
    amount
  ) {
    if (active) {
      try {
        console.log(amount)
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
      <StakeModel onStakeModel={StakeModelHandler} />
    </div>
  );
}

export default StakePage;
