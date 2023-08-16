import { useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import UnstakeModel from "../../components/unstake-components/unstake-model";
import UserInfoModel from "../../components/unstake-components/unstake-user-info-model";
import { stakerAbi } from "../../constants/staker-abi";
import { contractAddresses } from "../../constants/contract-address";

function UnstakePage() {
  const { activate, active, library: provider } = useWeb3React();
  const signer = provider.getSigner();
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState("");
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState("");
  const [loadingSnackbarOpen, setLoadingSnackbarOpen] = useState(false);
  const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState(false);

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

  async function handleIndirectUnstake(amount) {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        showLoadingSnackbar();
        const tx = await contract.indirectWithdrawRequest(
          ethers.utils.parseEther(amount), 
          signerAddr, 
          signerAddr, 
          { 
            from: signerAddr,
            gasLimit: 2_000_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Success! You indirectly unstaked: " + amount + " MATIC"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in indirect withdraw request:", error);
              } finally {
        setLoadingSnackbarOpen(false);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  async function handleDirectUnstake(amount) {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        showLoadingSnackbar();
        const tx = await contract.directWithdrawRequest(
          ethers.utils.parseEther(amount), 
          signerAddr, 
          signerAddr, 
          { 
            from: signerAddr,
            gasLimit: 2_000_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Success! You directly unstaked: " + amount + " MATIC"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in direct withdraw request:", error);
      } finally {
        setLoadingSnackbarOpen(false);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  return (
    <div>
      <UserInfoModel isSuccessSnackbarOpen={isSuccessSnackbarOpen} />
      <p className="note">Note: Having preshares indicates that you currently have pending indirect stake requests.
      <br/>While you have the option to withdraw funds that have not been staked yet, we highly recommend against doing so. 
      <br/>Please be aware that executing this action may result in significantly higher gas fees.</p>
      <UnstakeModel onIndirectUnstake={handleIndirectUnstake} onDirectUnstake={handleDirectUnstake} />
      <p className="note">Note: After a withdrawal request is processed, there is an additional 2-3 days 
      waiting period.<br/>This waiting period is a standard process implemented by Polygon.<br/>After this time, 
      your MATIC tokens will be available in your wallet.</p>
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
  );
}

export default UnstakePage;