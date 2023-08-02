import { useEffect, useRef, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

import Button from "../ui/button";
import classes from "./unstake-model.module.css";
import { stakerAbi } from "../../constants/staker-abi";
import { contractAddresses } from "../../constants/contract-address";

function UnstakeModel(props) {
  const { activate, active, library: provider } = useWeb3React();
  const AmountInputRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedModelInfo, setLoadedModelInfo] = useState([]);
  const signer = provider.getSigner();

  function submitHandler(event) {
    event.preventDefault();
  }

  function handleIndirectUnstake() {
    const amount = AmountInputRef.current.value;
    if (!isNaN(+amount)) {
      props.onIndirectUnstake(amount);
    }
  }

  function handleDirectUnstake() {
    const amount = AmountInputRef.current.value;
    if (!isNaN(+amount)) {
      props.onDirectUnstake(amount);
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (active) {
        setIsLoading(true);
        try {
          const modelInfo = {};
          const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
          
          const loadedWithdrawalFee = await contract.withdrawalFee();
          modelInfo["withdrawalFee"] = (loadedWithdrawalFee / 10000 * 100).toString();

          const loadedExpiryPeriod = await contract.expiryPeriod();
          modelInfo["expiryPeriod"] = (loadedExpiryPeriod / 86400).toString();

          const loadedMinWithdrawalAmount = await contract.minWithdrawalAmount();
          modelInfo["minWithdrawalAmount"] = parseFloat(ethers.utils.formatEther(loadedMinWithdrawalAmount)).toString();

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
    <form className={classes.form} onSubmit={submitHandler}>
      <div className={classes.controls}>
        <div className={classes.mainControl}>
          <label htmlFor="Amount">Amount</label>
          <input
            type="text"
            required
            id="Amount"
            ref={AmountInputRef}
          />
        </div>

        <div className={classes.secondaryControl}>
          <Button onClick={handleIndirectUnstake}>
            Indirect Unstake
            {isLoading ? <p style={{ fontSize: '14px', fontStyle: 'italic' }}>Calculating...</p> : (
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> + {loadedModelInfo["withdrawalFee"]}% fee <br/> processed within {loadedModelInfo["expiryPeriod"]} days
              <br/> <br/> Minimum amount: {loadedModelInfo["minWithdrawalAmount"]} MATIC
            </div>
            )}
          </Button>
          <Button onClick={handleDirectUnstake}>
            Direct Unstake
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> + staking fee <br/> processed immediately
              <br/> <br/>No minimum amount
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UnstakeModel;