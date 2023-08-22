import { useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import StakeModel from "../../components/stake-components/stake-model";
import UserInfoModel from "../../components/stake-components/stake-user-info-model";
import { stakerAbi } from "../../constants/staker-abi";
import { maticGoerliAbi } from "../../constants/matic-goerli-abi";
import { contractAddresses } from "../../constants/contract-address";

function StakePage() {
  const { activate, active, library: provider } = useWeb3React();
  const signer = provider.getSigner();
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState("");
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState("");
  const [loadingSnackbarOpen, setLoadingSnackbarOpen] = useState(false);
  const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState(0);

  const showSuccessSnackbar = (message) => {
    setSuccessSnackbarMessage(message);
    setSuccessSnackbarOpen(true);
    setIsSuccessSnackbarOpen(isSuccessSnackbarOpen + 1);
  };
  
  const showErrorSnackbar = (message) => {
    setErrorSnackbarMessage(message);
    setErrorSnackbarOpen(true);
  };

  const showLoadingSnackbar = () => {
    setLoadingSnackbarOpen(true);
  };

  async function handleIndirectStake(amount) {
    if (active) {
      const signerAddr = await signer.getAddress();
      const contract = new ethers.Contract(contractAddresses["staker"], stakerAbi, signer);
      try {
        showLoadingSnackbar();
        const tx = await contract.indirectDeposit(
          ethers.utils.parseEther(amount), 
          signerAddr, 
          { 
            from: signerAddr,
            gasLimit: 2_000_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Success! You indirectly staked: " + amount + " MATIC"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in indirect deposit:", error);
      } finally {
        setLoadingSnackbarOpen(false);
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
        showLoadingSnackbar();
        const tx = await contract.directDeposit(
          ethers.utils.parseEther(amount), 
          signerAddr, 
          { 
            from: signerAddr,
            gasLimit: 2_000_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Success! You directly staked: " + amount + " MATIC"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in direct deposit:", error);
      } finally {
        setLoadingSnackbarOpen(false);
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
        showLoadingSnackbar();
        const tx = await stakingTokenContract.approve(
          contractAddresses["staker"], 
          ethers.utils.parseEther(amount), 
          { 
            from: signerAddr,
            gasLimit: 200_000
          });
          await tx.wait().then((receipt) => {
            showSuccessSnackbar("Successfully approved: " + amount + " MATIC"); 
          }).catch((err) => {
            console.log("Transaction Failed! Error: ", err)
            showErrorSnackbar("Transaction Failed!"); 
          });
      } catch (error) {
        console.error("Error in approval:", error);
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
      <p className="note">Note: The approved balance needs to be equal or greater that the amount to be staked. 
      <br/>For indirect staking you need to take into account the fee.</p>
      <StakeModel onIndirectStake={handleIndirectStake} onDirectStake={handleDirectStake} onApprove={handleApprove}/>
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

export default StakePage;