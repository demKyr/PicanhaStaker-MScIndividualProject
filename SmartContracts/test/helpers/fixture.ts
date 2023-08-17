/** Helper file exporting a testing fixture for fresh deployments. */

import { ethers, upgrades } from "hardhat";
import * as constants from "../helpers/constants";
import { AddressZero } from "@ethersproject/constants";
import { setTokenBalancesAndApprove } from "./state-interaction";
import { parseEther } from "./math";

export const deployment = async () => {
  // load deployed contracts

  const token = await ethers.getContractAt(
    constants.STAKING_TOKEN_ABI[constants.DEFAULT_CHAIN_ID],
    constants.STAKING_TOKEN_ADDRESS[constants.DEFAULT_CHAIN_ID]
  );

  const validatorShare = await ethers.getContractAt(
    constants.VALIDATOR_SHARE_ABI[constants.DEFAULT_CHAIN_ID],
    constants.VALIDATOR_SHARE_CONTRACT_ADDRESS[constants.DEFAULT_CHAIN_ID]
  );

  const stakeManager = await ethers.getContractAt(
    constants.STAKE_MANAGER_ABI[constants.DEFAULT_CHAIN_ID],
    constants.STAKE_MANAGER_CONTRACT_ADDRESS[constants.DEFAULT_CHAIN_ID]
  );

  // load signers, balances set to 10k ETH in hardhat config file
  const [deployer, treasury, one, two, three, four, five, six, seven] = await ethers.getSigners();

  const staker = await ethers.getContractFactory("TruStakeMATICv2").then(
    (stakerFactory) => upgrades.deployProxy(stakerFactory, [
      token.address,
      stakeManager.address,
      validatorShare.address,
      treasury.address,
      constants.PHI,
      constants.CAP,
      constants.DEPOSIT_FEE,
      constants.WITHDRAWAL_FEE,
      constants.MIN_DEPOSIT_AMOUNT,
      constants.MIN_WITHDRAWAL_AMOUNT,
      constants.EXPIRY_PERIOD,
      constants.D_QUEUE_THRESHOLD,
      constants.W_QUEUE_THRESHOLD,
    ])
  );

  // set each balance to 10M MATIC and approve it to staker
  await setTokenBalancesAndApprove(
    token,
    [treasury, one, two, three, four, five, six],
    staker.address,
    parseEther(10e6)
  );


  return {
    deployer, treasury, one, two, three, four, five, six,  // accounts
    token, validatorShare, stakeManager, staker // contracts
  }
};
