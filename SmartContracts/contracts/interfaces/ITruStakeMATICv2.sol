// SPDX-License-Identifier: GPL-3.0
// The code outside the <TruStake Picanha></TruStake Picanha> tags constitutes pre-existing code from TruStakeMATIC.
// The code within <TruStake Picanha></TruStake Picanha> tags was written by Demetris Kyriacou for the TruStake Picanha vault.

pragma solidity =0.8.19;

interface ITruStakeMATICv2 {
    // --- Events ---

    /// @notice Emitted on initialize.
    /// @dev params same as initialize function.
    event StakerInitialized(
        address _stakingTokenAddress,
        address _stakeManagerContractAddress,
        address _validatorShareContractAddress,
        address _treasuryAddress,
        uint256 _phi,
        uint256 _cap,
        uint256 _depositFee,
        uint256 _withdrawalFee,
        uint256 _minDepositAmount,
        uint256 _minWithdrawalAmount,
        uint256 _expiryPeriod,
        uint256 _dQueueThreshold,
        uint256 _wQueueThreshold
    );
    
    // -------------------------- <TruStake Picanha> ---------------------------
    event UnbondNonceClaimed(uint256 _unbondNonce);

    event UnbondNonceCreated(uint256 _unbondNonce, uint256 _currentEpoch);

    event StakeRequired();

    event UnstakeRequired();

    event IndirectDepositEvent(address _user, uint256 _amount);

    event DirectDepositEvent(address _user, uint256 _amount);

    event IndirectWithdrawalEvent(address _user, uint256 _amount);

    event DirectWithdrawalEvent(address _user, uint256 _amount);
    // -------------------------- </TruStake Picanha> --------------------------

    // --- Errors ---

    // -------------------------- <TruStake Picanha> ---------------------------
    /// @notice error thrown when a user attempts to allocate less than the minimum direct deposit amount
    error DepositUnderMinDirectDepositAmount();

    /// @notice error thrown when a user attempts to directly withdraw less than the minimum withdrawal amount
    error DirectWithdrawalRequestAmountBelowMin();
    // -------------------------- </TruStake Picanha> --------------------------

    /// @notice Error thrown when the phi value is larger than the phi precision constant.
    error PhiTooLarge();

    /// @notice Error thrown when a user tries to deposit under 1 MATIC.
    error DepositUnderOneMATIC();

    /// @notice Error thrown when a deposit causes the vault staked amount to surpass the cap.
    error DepositSurpassesVaultCap();

    /// @notice Error thrown when a user tries to request a withdrawal with an amount larger
    /// than their shares entitle them to.
    error WithdrawalAmountTooLarge();

    /// @notice Error thrown when a user tries to request a withdrawal of amount zero.
    error WithdrawalRequestAmountCannotEqualZero();

    /// @notice Error thrown when a user tries to claim a withdrawal they did not request.
    error SenderMustHaveInitiatedWithdrawalRequest();

    /// @notice Error used in ERC-4626 integration, thrown when user tries to act on
    /// behalf of different user.
    error SenderAndOwnerMustBeReceiver();

    /// @notice Error used in ERC-4626 integration, thrown when user tries to transfer
    /// or approve to zero address.
    error ZeroAddressNotSupported();

    /// @notice Error thrown when user allocates more MATIC than available.
    error InsufficientDistributorBalance();

    /// @notice Error thrown when user calls distributeRewards for
    /// recipient with nothing allocated to them.
    error NoRewardsAllocatedToRecipient();

    /// @notice Error thrown when user calls distributeRewards when the allocation
    /// share price is the same as the current share price.
    error NothingToDistribute();

    /// @notice Error thrown when a user tries to a distribute rewards allocated by
    /// a different user.
    error OnlyDistributorCanDistributeRewards();

    /// @notice Error thrown when a user tries to transfer more share than their
    /// balance subtracted by the total amount they have strictly allocated.
    error ExceedsUnallocatedBalance();



}
