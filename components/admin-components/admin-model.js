import { useEffect, useRef, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import Button from "../ui/button";
import classes from "./admin-model.module.css";
import { stakerAbi } from "../../constants/staker-abi";
import { contractAddresses } from "../../constants/contract-address";

function AdminModel(props) {
  const { activate, active, library: provider } = useWeb3React();
  const AmountInputRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedModelInfo, setLoadedModelInfo] = useState([]);
  const signer = provider.getSigner();
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState("");
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState("");
  const [loadingSnackbarOpen, setLoadingSnackbarOpen] = useState(false);

  const showSuccessSnackbar = (message) => {
    setSuccessSnackbarMessage(message);
    setSuccessSnackbarOpen(true);
    setIsSuccessSnackbarOpen(true);
  };
  
  const showErrorSnackbar = (message) => {
    setErrorSnackbarMessage(message);
    setErrorSnackbarOpen(true);
  };

  const showLoadingSnackbar = () => {
    setLoadingSnackbarOpen(true);
  };

  function submitHandler(event) {
    event.preventDefault();
  }

  async function handleStake() {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        showLoadingSnackbar();
        const tx = await contract.indirectStake(
          { 
            from: signerAddr,
            gasLimit: 2_000_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Staking was successful!"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in staking", error);
      } finally {
        setLoadingSnackbarOpen(false);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  async function handleUnstake() {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        showLoadingSnackbar();
        const tx = await contract.indirectUnstakeRequest(
          { 
            from: signerAddr,
            gasLimit: 2_000_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Staking was successful!"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in staking", error);
      } finally {
        setLoadingSnackbarOpen(false);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (active) {
        setIsLoading(true);
        try {
          const modelInfo = {};
          const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);

          const loadedDQueueBalance = await contract.dQueueBalance();
          modelInfo["dQueueBalance"] = parseFloat(ethers.utils.formatEther(loadedDQueueBalance)).toString();

          const loadedDQueueThreshold = await contract.dQueueThreshold();
          modelInfo["dQueueThreshold"] = parseFloat(ethers.utils.formatEther(loadedDQueueThreshold)).toString();

          const loadedWQueueBalance = await contract.wQueueBalance();
          modelInfo["wQueueBalance"] = parseFloat(ethers.utils.formatEther(loadedWQueueBalance)).toString();

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
  }, [props.isSuccessSnackbarOpen]);

  return (
    <form className={classes.form} onSubmit={submitHandler}>
      <div className={classes.controls}>


        <div className={classes.secondaryControl}>
          <Button onClick={handleStake}>
            Stake
            {isLoading ? <p style={{ fontSize: '14px', fontStyle: 'italic' }}>Calculating...</p> : (
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> {loadedModelInfo["dQueueBalance"]} / {loadedModelInfo["dQueueThreshold"]} MATIC in dQueue
            </div>
          )}
          </Button>
          <Button onClick={handleUnstake}>
            Unstake
            {isLoading ? <p style={{ fontSize: '14px', fontStyle: 'italic' }}>Calculating...</p> : (
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> {loadedModelInfo["wQueueBalance"]} / {loadedModelInfo["wQueueThreshold"]} MATIC in wQueue
            </div>
            )}
          </Button>
        </div>
        <Snackbar open={successSnackbarOpen} autoHideDuration={6000} onClose={() => setSuccessSnackbarOpen(false)}>
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={() => setSuccessSnackbarOpen(false)}
            severity="success"
          >
            {successSnackbarMessage}
          </MuiAlert>
        </Snackbar>
        <Snackbar open={errorSnackbarOpen} autoHideDuration={6000} onClose={() => setErrorSnackbarOpen(false)}>
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={() => setErrorSnackbarOpen(false)}
            severity="error"
          >
            {errorSnackbarMessage}
          </MuiAlert>
        </Snackbar>
        <Snackbar open={loadingSnackbarOpen}>
          <MuiAlert
            elevation={6}
            variant="filled"
            severity="info"
          >
            Loading...
          </MuiAlert>
        </Snackbar>
      </div>
    </form>
  );
}

export default AdminModel;