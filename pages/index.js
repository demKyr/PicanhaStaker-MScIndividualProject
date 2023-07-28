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
      <h1 className={classes.title}>Welcome to DEMOS</h1>
      <div className={classes.logo}>
        <Image src="/logo.png" alt="home" width="350" height="350" />
      </div>
      <p className={classes.bodyText}>
        DEMOS (Distributedly Enhanced Machine learning Optimization System) is a

      </p>

    </div>
  );
}

export default HomePage;
