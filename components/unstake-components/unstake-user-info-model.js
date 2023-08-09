import { useWeb3React } from "@web3-react/core";
import { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

import classes from "./unstake-user-info-model.module.css";
import { stakerAbi } from "../../constants/staker-abi";
import { maticGoerliAbi } from "../../constants/matic-goerli-abi";
import { contractAddresses } from "../../constants/contract-address";
import { truncateDecimals } from "../../constants/functions";

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
          const loadedRewards = parseFloat((loadedBalanceMATIC - loadedBalance)/1e18);
          modelInfo["balance"] = truncateDecimals(loadedBalanceMATICFloat,5).toString();
          modelInfo["rewards"] = truncateDecimals(loadedRewards,5).toString();

          const loadedPreshares = await contract.getUserPreshares(signerAddr);
          modelInfo["preshares"] = truncateDecimals(parseFloat(ethers.utils.formatEther(loadedPreshares)),5).toString();

          const loadedWalletBalance = await stakingTokenContract.balanceOf(signerAddr);
          modelInfo["walletBalance"] = truncateDecimals(parseFloat(ethers.utils.formatEther(loadedWalletBalance)),5).toString();

          const loadedMaxWithdraw = await contract.maxWithdraw(signerAddr);
          modelInfo["maxWithdraw"] = truncateDecimals(parseFloat(ethers.utils.formatEther(loadedMaxWithdraw)),5).toString();
          
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
          <span className={classes.title}>Rewards:</span>
          <span className={classes.value}>{loadedModelInfo["rewards"]} MATIC</span>
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
