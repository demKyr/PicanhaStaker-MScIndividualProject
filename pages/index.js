import Link from "next/link";
import { useWeb3React } from "@web3-react/core";
import { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

import { stakerAbi } from "../constants/staker-abi";
import { contractAddresses } from "../constants/contract-address";
import ContractsContext from "../store/contract-context";
import classes from "./index.module.css";
import Image from "next/image";

function HomePage() {
  const [loading, setLoading] = useState(true);
  const contractsCtx = useContext(ContractsContext);
  const { account, library: provider } = useWeb3React();

  useEffect(() => {
    function setCtxs() {
      const signer = provider.getSigner();
      const contractAddress = contractAddresses["staker"];
      const contract = new ethers.Contract(
        contractAddress,
        stakerAbi,
        signer
      );
      contractsCtx.addContract("staker", contract);
    }
    setCtxs();
  }, []);

  return (
    <div>
      <h1 className={classes.title}>Welcome to TruStake Picanha vault</h1>
      <div className={classes.logo}>
        <Image src="/logo.png" alt="home" width="350" height="350" />
      </div>
      <p className={classes.bodyText}>
        TruStake Picanha vault is a staking vault for MATIC tokens,<br/>  meticulously designed to optimize transaction fees 
        for both staking and unstaking processes.<br/> Our objective is to make native staking accessible to all, <br/> 
        offering a passive and secure source of income, guided by: 
        <br/>Trustless operation
        <br/>Non-custodial management
        <br/>Risk-free participation
      </p>
    </div>
  );
}

export default HomePage;
