import { useWeb3React } from "@web3-react/core";
import { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

import classes from "./admin-info-model.module.css";
import { stakerAbi } from "../../constants/staker-abi";
import { maticGoerliAbi } from "../../constants/matic-goerli-abi";
import { contractAddresses } from "../../constants/contract-address";

function AdminInfoModel() {

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

          const loadedTotalStaked = await contract.totalStaked();
          modelInfo["totalStaked"] = parseFloat(ethers.utils.formatEther(loadedTotalStaked)).toFixed(5).toString();
          const loadedVaultBalance = await contract.totalAssets();
          modelInfo["vaultBalance"] = parseFloat(ethers.utils.formatEther(loadedVaultBalance)).toFixed(5).toString();
          const loadedUnclaimedRewards = await contract.totalRewards();
          modelInfo["unclaimedRewards"] = parseFloat(ethers.utils.formatEther(loadedUnclaimedRewards)).toFixed(5).toString();
          const loadedTotalShares = await contract.totalSupply();
          modelInfo["totalShares"] = parseFloat(ethers.utils.formatEther(loadedTotalShares)).toFixed(5).toString();
          const loadedTotalPreshares = await contract.dQueueBalance();
          modelInfo["totalpreshares"] = parseFloat(ethers.utils.formatEther(loadedTotalPreshares)).toFixed(5).toString();
          const [loadedSharePriceNum,loadedSharePriceDenom] = await contract.sharePrice();
          modelInfo["sharePrice"] = parseFloat(loadedSharePriceNum/loadedSharePriceDenom/1e18).toFixed(5).toString();

          const loadedBalance = await contract.balanceOf(signerAddr);
          const loadedBalanceMATIC = await contract.toAssets(loadedBalance);
          const loadedBalanceMATICFloat = parseFloat(ethers.utils.formatEther(loadedBalanceMATIC));
          modelInfo["treasuryBalance"] = loadedBalanceMATICFloat.toFixed(5).toString();

          const loadedLatestUnbondingNonce = await contract.latestUnbondingNonce();
          modelInfo["latestUnbondingNonce"] = loadedLatestUnbondingNonce.toString();

          const loadedCap = await contract.cap();
          modelInfo["cap"] = parseFloat(ethers.utils.formatEther(loadedCap)).toFixed(2).toString();
          const loadedDepositFee = await contract.depositFee();
          modelInfo["depositFee"] = (loadedDepositFee / 10000 * 100).toString();
          const loadedWithdrawalFee = await contract.withdrawalFee();
          modelInfo["withdrawalFee"] = (loadedWithdrawalFee / 10000 * 100).toString();
          const loadedMinDepositAmount = await contract.minDepositAmount();
          modelInfo["minDepositAmount"] = parseFloat(ethers.utils.formatEther(loadedMinDepositAmount)).toString();
          const loadedMinWithdrawalAmount = await contract.minWithdrawalAmount();
          modelInfo["minWithdrawalAmount"] = parseFloat(ethers.utils.formatEther(loadedMinWithdrawalAmount)).toString();
          const loadedExpiryPeriod = await contract.expiryPeriod();
          modelInfo["expiryPeriod"] = (loadedExpiryPeriod / 86400).toString();
          const loadedDQueueThreshold = await contract.dQueueThreshold();
          modelInfo["dQueueThreshold"] = parseFloat(ethers.utils.formatEther(loadedDQueueThreshold)).toString();
          const loadedWQueueThreshold = await contract.wQueueThreshold();
          modelInfo["wQueueThreshold"] = parseFloat(ethers.utils.formatEther(loadedWQueueThreshold)).toString();

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
        <label className={classes.label}>Vault info:</label>
        <div className={classes.listItem}>
          <span className={classes.title}>Total Staked:</span>
          <span className={classes.value}>{loadedModelInfo["totalStaked"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Vault Balance:</span>
          <span className={classes.value}>{loadedModelInfo["vaultBalance"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Unclaimed Rewards:</span>
          <span className={classes.value}>{loadedModelInfo["unclaimedRewards"]} MATIC</span>
        </div>
        <hr className={classes.horizontalLine}/>
        <div className={classes.listItem}>
          <span className={classes.title}>Total Shares:</span>
          <span className={classes.value}>{loadedModelInfo["totalShares"]} truMATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Total Preshares:</span>
          <span className={classes.value}>{loadedModelInfo["totalpreshares"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Share Price:</span>
          <span className={classes.value}>{loadedModelInfo["sharePrice"]} MATIC</span>
        </div>
        <hr className={classes.horizontalLine}/>
        <div className={classes.listItem}>
          <span className={classes.title}>Treasury Balance:</span>
          <span className={classes.value}>{loadedModelInfo["treasuryBalance"]} MATIC</span>
        </div>
        <hr className={classes.horizontalLine}/>
        <div className={classes.listItem}>
          <span className={classes.title}>Latest Unbonding Nonce:</span>
          <span className={classes.value}>{loadedModelInfo["latestUnbondingNonce"]}</span>
        </div>
        <hr className={classes.horizontalLine}/>
        <label className={classes.label}>Model Parameters:</label>
        <div className={classes.listItem}>
          <span className={classes.title}>Cap:</span>
          <span className={classes.value}>{loadedModelInfo["cap"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Deposit Fee:</span>
          <span className={classes.value}>{loadedModelInfo["depositFee"]}%</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Withdrawal Fee:</span>
          <span className={classes.value}>{loadedModelInfo["withdrawalFee"]}%</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Min Deposit Amount:</span>
          <span className={classes.value}>{loadedModelInfo["minDepositAmount"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Min Withdrawal Amount:</span>
          <span className={classes.value}>{loadedModelInfo["minWithdrawalAmount"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>Expiry Period:</span>
          <span className={classes.value}>{loadedModelInfo["expiryPeriod"]} days</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>DQueue Threshold:</span>
          <span className={classes.value}>{loadedModelInfo["dQueueThreshold"]} MATIC</span>
        </div>
        <div className={classes.listItem}>
          <span className={classes.title}>WQueue Threshold:</span>
          <span className={classes.value}>{loadedModelInfo["wQueueThreshold"]} MATIC</span>
        </div>
      </form>
    </div>
  );
  
}

export default AdminInfoModel;
