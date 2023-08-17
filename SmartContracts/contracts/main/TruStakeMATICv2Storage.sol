// SPDX-License-Identifier: GPL-3.0
// The code outside the <TruStake Picanha></TruStake Picanha> tags constitutes pre-existing code from TruStakeMATIC.
// The code within <TruStake Picanha></TruStake Picanha> tags was written by Demetris Kyriacou for the TruStake Picanha vault.

pragma solidity =0.8.19;

import {IndirectWithdrawal} from "./Types.sol";
import {Queue} from "./QueueWithMap.sol";              

/// @title TruStakeMATICStorage
abstract contract TruStakeMATICv2Storage {
    // -------------------------- <TruStake Picanha> ---------------------------
    /// @notice Saves the latest unbonding nonce
    uint256 public latestUnbondingNonce;

    /// @notice Period of time after which a request expires
    uint256 public expiryPeriod;

    /// @notice Size of fee taken on deposits
    /// @dev Fee in basis points
    uint256 public depositFee;

    /// @notice Size of fee taken on withdrawals
    /// @dev Fee in basis points
    uint256 public withdrawalFee;

    /// @notice Minimum deposit amount
    uint256 public minDepositAmount;

    /// @notice Minimum withdrawal amount
    uint256 public minWithdrawalAmount;

    /// @notice Queue for deposit requests
    Queue dQueue;

    /// @notice Queue for withdrawal requests
    Queue wQueue;

    /// @notice Total balance of the deposit queue
    uint256 public dQueueBalance;

    /// @notice Total balance of the withdrawal queue
    uint256 public wQueueBalance;

    /// @notice Threshold for the deposit queue
    uint256 public dQueueThreshold;

    /// @notice Threshold for the withdrawal queue
    uint256 public wQueueThreshold;

    /// @notice Mapping of user to their preshares
    mapping(address => uint256) preshares;

    /// @notice Mapping to keep track of (user, amount) values for each unbond nonce
    /// @dev Maps nonce of validator unbonding to a Withdrawal (user & amount)
    mapping(uint256 => IndirectWithdrawal) indirectUnbondingWithdrawals;
    // -------------------------- </TruStake Picanha> --------------------------

    // Staker constants

    /// @notice Address of MATIC on this chain (Ethereum and Goerli supported).
    address stakingTokenAddress;

    /// @notice The stake manager contract deployed by Polygon.
    address stakeManagerContractAddress;

    /// @notice The validator share contract deployed by a validator.
    address validatorShareContractAddress;

    /// @notice The treasury gathers fees during the restaking of rewards as shares.
    address treasuryAddress;

    /// @notice Size of fee taken on rewards.
    /// @dev Fee in basis points.
    uint256 phi;

    /// @notice Size of fee taken on non-strict allocations.
    /// @dev Distribution fee in basis points.
    uint256 distPhi;

    /// @notice Cap on total amount staked with the validator.
    uint256 public cap;

    /// @notice Value to offset rounding errors.
    uint256 epsilon;

}
