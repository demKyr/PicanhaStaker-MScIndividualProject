import { useWeb3React } from "@web3-react/core";
import { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

import classes from "./unstake-user-info-model.module.css";
import { stakerAbi } from "../../constants/staker-abi";
import { maticGoerliAbi } from "../../constants/matic-goerli-abi";
import { contractAddresses } from "../../constants/contract-address";

function UserInfoModel() {

  const { activate, active, library: provider } = useWeb3React();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedModelInfo, setLoadedModelInfo] = useState([]);
  const signer = provider.getSigner();

useEffect(() => {
    async function fetchData() {
      if (active) {
        setIsLoading(true);
        try {
          const signerAddr = await signer.getAddress();
          const modelInfo = {};
          const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
          const stakingTokenContract = new ethers.Contract(contractAddresses["maticGoerli"], maticGoerliAbi, signer);

          const loadedBalance = await contract.balanceOf(signerAddr);
          const loadedBalanceMATIC = await contract.toAssets(loadedBalance);
          const loadedBalanceMATICFloat = parseFloat(ethers.utils.formatEther(loadedBalanceMATIC));
          modelInfo["balance"] = loadedBalanceMATICFloat.toString();

          const loadedPreshares = await contract.getUserPreshares(signerAddr);
          modelInfo["preshares"] = loadedPreshares.toString();

          const loadedWalletBalance = await stakingTokenContract.balanceOf(signerAddr);
          modelInfo["walletBalance"] = parseFloat(ethers.utils.formatEther(loadedWalletBalance)).toString();

          const loadedMaxWithdraw = await contract.maxWithdraw(signerAddr);
          modelInfo["maxWithdraw"] = loadedMaxWithdraw.toString();
          
          setIsLoading(false);
          setLoadedModelInfo(modelInfo);
        } catch (error) {
          console.log(error);
        }
      } else {
        document.getElementById("executeButton").innerHTML =
          "Please install Metamask";
      }
    }
    fetchData();
  }, []);

  return (
    <div className={classes.userInfo}>
      <form className={`${classes.form} ${classes.list}`}>
        <div className={classes.listItem}>
          <span className={classes.title}>Balance:</span>
          <span className={classes.value}>{loadedModelInfo["balance"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Preshares:</span>
          <span className={classes.value}>{loadedModelInfo["preshares"]} MATIC</span>
        </div>
        <hr className={classes.horizontalLine}/>
        <div className={classes.listItem}>
          <span className={classes.title}>Available in wallet:</span>
          <span className={classes.value}>{loadedModelInfo["walletBalance"]} MATIC</span>
        </div>
        <hr className={classes.horizontalLine}/>
        <div className={classes.listItem}>
          <span className={classes.title}>Max Withdraw:</span>
          <span className={classes.value}>{loadedModelInfo["maxWithdraw"]} MATIC</span>
        </div>
      </form>
    </div>
  );
  
}

export default UserInfoModel;
