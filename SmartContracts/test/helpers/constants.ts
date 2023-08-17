import { BigNumber } from "ethers";

import MaticTokenABI from "../../constants/abis/ethereum/MaticToken.json";
import StakeManagerABI from "../../constants/abis/ethereum/StakeManager.json";
import ValidatorShareABI from "../../constants/abis/ethereum/ValidatorShare.json";

import GMaticTokenABI from "../../constants/abis/goerli/MaticToken.json";
import GStakeManagerABI from "../../constants/abis/goerli/StakeManager.json";
import GValidatorShareABI from "../../constants/abis/goerli/ValidatorShare.json";


// --- Chain Config ---

export enum CHAIN_ID {
    ETH_MAINNET = 1,
    GOERLI = 5,
    MUMBAI = 80001,
};

export const DEFAULT_CHAIN_ID = 1;

// --- Constructor Arguments ---

// Account addresses

export const TREASURY_ADDRESS = {
    [CHAIN_ID.ETH_MAINNET]: "0x8680173376b74E50C8e81A2b461252EfFEC922b3", // << correct according to gnosis safe // other: "0xDbE6ACf2D394DBC830Ed55241d7b94aaFd2b504D",
    [CHAIN_ID.GOERLI]: "0xDbE6ACf2D394DBC830Ed55241d7b94aaFd2b504D",
    [CHAIN_ID.MUMBAI]: "0x0000000000000000000000000000000000000000",
};

// Contract addresses

export const STAKING_TOKEN_ADDRESS = {
    [CHAIN_ID.ETH_MAINNET]: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // correct according to etherscan
    [CHAIN_ID.GOERLI]: "0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae",
    [CHAIN_ID.MUMBAI]: "0x0000000000000000000000000000000000000000",
};

export const STAKE_MANAGER_CONTRACT_ADDRESS = {
    [CHAIN_ID.ETH_MAINNET]: "0x5e3Ef299fDDf15eAa0432E6e66473ace8c13D908", // correct according to validator share contract
    [CHAIN_ID.GOERLI]: "0x00200eA4Ee292E253E6Ca07dBA5EdC07c8Aa37A3",
    [CHAIN_ID.MUMBAI]: "0x0000000000000000000000000000000000000000",
};

export const ROOT_CHAIN_CONTRACT_ADDRESS = {
    [CHAIN_ID.ETH_MAINNET]: "0x86E4Dc95c7FBdBf52e33D563BbDB00823894C287",
    [CHAIN_ID.GOERLI]: "0x0000000000000000000000000000000000000000", // if forking goerli, remember to fill this
    [CHAIN_ID.MUMBAI]: "0x0000000000000000000000000000000000000000",
};

export const VALIDATOR_SHARE_CONTRACT_ADDRESS = {
    [CHAIN_ID.ETH_MAINNET]: "0x3EDBF7E027D280BCd8126a87f382941409364269", // stakebaby validator
    [CHAIN_ID.GOERLI]: "0x75605B4F7C52e37b4f37121DC4529b08dFC76b39",
    [CHAIN_ID.MUMBAI]: "0x0000000000000000000000000000000000000000",
};

// ABIs

export const STAKING_TOKEN_ABI = {
    [CHAIN_ID.ETH_MAINNET]: MaticTokenABI,
    [CHAIN_ID.GOERLI]: GMaticTokenABI,
}

export const STAKE_MANAGER_ABI = {
    [CHAIN_ID.ETH_MAINNET]: StakeManagerABI,
    [CHAIN_ID.GOERLI]: GStakeManagerABI,
};

export const VALIDATOR_SHARE_ABI = {
    [CHAIN_ID.ETH_MAINNET]: ValidatorShareABI,
    [CHAIN_ID.GOERLI]: GValidatorShareABI,
};

// Other args
export const EPSILON = BigNumber.from(1e4);

export const PHI = BigNumber.from(1000);

export const PHI_PRECISION = BigNumber.from(10000);

export const CAP = BigNumber.from(10).pow(10 + 18); 

export const DEPOSIT_FEE = BigNumber.from(10);

export const WITHDRAWAL_FEE = BigNumber.from(10);

export const MIN_DEPOSIT_AMOUNT = BigInt(100) * BigInt(1e18);

export const MIN_WITHDRAWAL_AMOUNT = BigInt(100) * BigInt(1e18);

export const EXPIRY_PERIOD = BigNumber.from(7 * 24 * 60 * 60);

export const D_QUEUE_THRESHOLD = BigInt(15000) * BigInt(1e18);

export const W_QUEUE_THRESHOLD = BigInt(15000) * BigInt(1e18);

export const NAME = "TruStake MATIC Vault Shares";

export const SYMBOL = "TruMATIC";
