// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.14;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IValidatorShare } from "./IValidatorShare.sol";

import "hardhat/console.sol";

struct WithdrawalRequest {
    address user;
    uint256 amount;
}

contract Staker {
    using SafeERC20 for IERC20;

    // Staker constants
    address public stakingTokenAddress;
    address public stakeManagerContractAddress;
    address public validatorShareContractAddress;
    
    address public ownerAddress;
    address public treasuryAddress;
    
    // Share + amount tracking
    uint256 public totalAmount; // total amount staked (not unbonding)
    uint256 public totalShares;
    mapping(address => uint256) public userShares;
    uint256 public rewardFee; // percent

    // Withdrawal tracking
    mapping(uint256 => WithdrawalRequest) public pendingWithdrawals; // unbondNonce => (user, amount) for each request

    constructor(
        address _stakingTokenAddress,
        address _stakeManagerContractAddress,
        address _validatorShareContractAddress,
        address _treasuryAddress,
        uint256 _rewardFee
    ) {
        stakingTokenAddress = _stakingTokenAddress;
        stakeManagerContractAddress = _stakeManagerContractAddress;
        validatorShareContractAddress = _validatorShareContractAddress;

        ownerAddress = msg.sender;
        treasuryAddress = _treasuryAddress;

        rewardFee = _rewardFee;
    }

    function setTreasury(address _treasuryAddress) public {
        // owner function
        require(
            msg.sender == ownerAddress,
            "Staker: message sender must be admin"
        );

        treasuryAddress = _treasuryAddress;
    }

    // --- Helpers ---

        // function sharesFromAmount(uint256 _amount) public view returns (uint256) {
        //     // used in deposit
            
        //     // total shares and amount are made 1 for the calculation if they are 0 to avoid zero division
        //     uint256 calcTotalShares = totalShares == 0 ? 1 : totalShares;
        //     uint256 calcTotalAmount = totalAmount == 0 ? 1 : totalAmount;
            
        //     return _amount * calcTotalShares / (calcTotalAmount + getUnstakedRewards());
        // }

        // function amountFromShares(uint256 _shares) public view returns (uint256) {
        //     // used in withdraw request
            
        //     // total shares and amount are made 1 for the calculation if they are 0 to avoid zero division
        //     uint256 calcTotalShares = totalShares == 0 ? 1 : totalShares;
        //     uint256 calcTotalAmount = totalAmount == 0 ? 1 : totalAmount;
            
        //     return (calcTotalAmount + getUnstakedRewards()) * _shares / calcTotalShares;
        // }
    
    function sharesFromAmount(uint256 _amount) public view returns (uint256 shares) {
        (uint256 sharePx, uint256 precision) = sharePrice();
        
        // this may introduce rounding errors
        // might have to replace the sharePrice function with something more integer-y
        return _amount * precision / sharePx;
    }

    function amountFromShares(uint256 _shares) public view returns (uint256 amount) {
        (uint256 sharePx, uint256 precision) = sharePrice();

        return _shares * sharePx / precision;
    }

    function getUnstakedRewards() public view returns (uint256) {
        return IValidatorShare(validatorShareContractAddress).getLiquidRewards(address(this)); // TODO: look into returns 0
    }

    function sharePrice() public view returns (uint256 price, uint256 precision) {
        // precision used to avoid rounding errors
        precision = 10_000;

        // total shares and amount are made 1 for the calculation if they are 0 to avoid zero division
        uint256 calcTotalShares = totalShares == 0 ? 1 : totalShares;

        price = (totalAmount * 100 + (100 - rewardFee) * getUnstakedRewards()) * precision / (calcTotalShares * 100);

        return (price == 0 ? precision : price, precision); // divide `price` by `precision` to get actual float share price
    }

    function getDust() external view returns (uint256 dust) {
        // dust is fees that havent yet been turned into shares
        // it's the failure of total number of shares * share price to add up to total amount in stake + reward
        return totalAmount + getUnstakedRewards() - amountFromShares(totalShares);
    }

    // --- Events ---

    event Deposited(address _user, uint256 _amount);
    
    event WithdrawalRequested(uint256 _unbondNonce, address _user, uint256 _amount);

    event Withdrawn(uint256 _requestID);

    event RewardsCompounded(uint256 _amount);

    // --- Deposits & Withdrawals (Users) ---

    function test() public {}

    function deposit(uint256 _amount) public {
        // transfer staking token from user to Staker
        IERC20(stakingTokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        // calculate share increase
        uint256 shareIncrease = sharesFromAmount(_amount);

        // adjust global variables
        totalAmount += _amount;
        userShares[msg.sender] += shareIncrease;
        totalShares += shareIncrease;

        // approve funds
        IERC20(stakingTokenAddress).safeIncreaseAllowance(stakeManagerContractAddress, _amount);

        // interact with staking contract
        _stake(_amount);

        emit Deposited(msg.sender, _amount);
    }

    // TODO: mint NFT representing withdrawal receipt
    function withdrawRequest(uint256 _amount) public returns (uint256 unbondNonce) {
        // funds stop accruing straight away, so decrease shares straight away and separate
        // unbonding funds into a different pool (in the form of a withdrawal request)
        require(
            amountFromShares(userShares[msg.sender]) >= _amount,
            "Staker: withdrawal amount requested too large"
        );

        // calculate share decrease
        uint256 shareDecrease = sharesFromAmount(_amount);

        // adjust global variables
        totalAmount -= _amount;
        userShares[msg.sender] -= shareDecrease;
        totalShares -= shareDecrease;

        // interact with staking contract to initiate unbonding
        unbondNonce = _unbond(_amount);

        // issues a withdrawal request ticket
        pendingWithdrawals[unbondNonce] = WithdrawalRequest(msg.sender, _amount);
        emit WithdrawalRequested(unbondNonce, msg.sender, _amount);

        return unbondNonce;
    }

    // get epoch from stakeManager.epoch()
    // only once 80 epochs have passed can you

    // Incomplete withdrawal period:
    // unbond.withdrawEpoch + stakeManager.withdrawalDelay() <= stakeManager.epoch()
    // unbond.shares > 0

    function withdraw(uint256 _unbondNonce) public {
        WithdrawalRequest storage request = pendingWithdrawals[_unbondNonce];

        require(
            msg.sender == request.user,
            "Staker: user not creator of withdrawal request"
        );

        _claimStake(_unbondNonce);

        IERC20 stakingToken = IERC20(stakingTokenAddress);

        stakingToken.safeTransfer(msg.sender, request.amount);
        
        delete pendingWithdrawals[_unbondNonce];
        
        emit Withdrawn(_unbondNonce);
    }

    // --- Interaction with Polygon staking contract (Staker) ---
    // buyVoucher example: https://goerli.etherscan.io/address/0x0b764b080a67f9019677ae2c9279f52485fd4525#writeProxyContract

    function _stake(uint256 _amount) private {
        IValidatorShare(validatorShareContractAddress).buyVoucher(_amount, 2423);
        // (uint256 amountToDeposit)

        // currently assuming the entire amount was used to stake -- apparently may not always be the case?
        // see https://goerli.etherscan.io/address/0x41a9c376ec9089e91d453d3ac6b0ff4f4fd7ccec#code _buyVoucher() fn
    }

    function _unbond(uint256 _amount) private returns (uint256 unbondNonce) {
        // Takes 3 days, rewards stop accruing immediately
        IValidatorShare(validatorShareContractAddress).sellVoucher_new(_amount, _amount);

        return IValidatorShare(validatorShareContractAddress).unbondNonces(address(this));
    }

    function _claimStake( uint256 _unbondNonce) private {
        // transfer all unstaked MATIC to vault in original unbonding call
        IValidatorShare(validatorShareContractAddress).unstakeClaimTokens_new(_unbondNonce);
    }

    function _restake() private returns (uint256) {
        (uint256 amountRestaked,) = IValidatorShare(validatorShareContractAddress).restake();
        //  (uint256 amountRestaked, uint256 liquidReward)
        
        return amountRestaked;
    }

    // --- Compounding Rewards ---

        // function compoundRewards() public {
        //     // keeper function
        //     require(
        //         msg.sender == keeperAddress,
        //         "Staker: message sender must be keeper"
        //     );

        //     // restake as many rewards as possible
        //     uint256 amountRestaked = _restake();

        //     totalAmount += amountRestaked; // share value increase
        //     // getUnstakedRewards() should now return previous getUnstakedRewards() - (liquidReward - amountRestaked)

        //     emit RewardsCompounded(amountRestaked);
        // }

    function compoundRewards() public {
        // This function can be called by anyone.  Caller pays the gas.
        // We will have a cron-job that checks if rewards are above a threshold and call restake ourselves if so.


        // restake as many rewards as possible
        uint256 amountRestaked = _restake();

        // to keep share price constant when rewards are staked, new shares need to be minted
        (uint256 sharePx, uint256 precision) = sharePrice();
        uint256 shareIncrease = (totalAmount + amountRestaked) * precision / sharePx - totalShares;

        // these are given to the treasury to effectively take a fee
        // totalShares also increases, zeroing the dust balance by definition
        userShares[treasuryAddress] += shareIncrease;
        totalShares += shareIncrease; // share value decrease

        // rewards are added to the totalAmount
        totalAmount += amountRestaked; // share value increase
        // getUnstakedRewards() should now return previous getUnstakedRewards() - (liquidReward - amountRestaked)

        emit RewardsCompounded(amountRestaked);
    }

    // --- Temp withdraw all function ---

    function rescueFunds() public {
        payable(msg.sender).transfer(address(this).balance);
        IERC20(stakingTokenAddress).safeTransfer(msg.sender, IERC20(stakingTokenAddress).balanceOf(address(this)));
    }

}

// TODO: set min amounts on functions with _amount to avoid rounding issues?


/* Scenario

--- Stepping through ---

Alice deposits 80 WMATIC into the Staker

A has 80 shares (entitled to 80 matic)
T is 80 shares (80 matic)

Bob deposits 20 WMATIC into the Staker

A has 80 shares (entitled to 80 matic)
B has 20 shares (entitled to 20 matic)
T is 100 shares (100 matic)

Several staking periods pass, the amount in the vault increases to 200 WMATIC

A has 80 shares (entitled to 160 matic)
B has 20 shares (entitled to 40 matic)
T is 100 shares (200 matic)

Charlie deposits 50 WMATIC into the Staker

A has 80 shares (entitled to 160 matic)
B has 20 shares (entitled to 40 matic)
C has 25 shares (entitled to 50 matic)
T is 125 shares (250 matic)

--- Calculations ---

T_NEW_SHARES = (T_NEW_AMT/T_OLD_AMT) * T_OLD_SHARES
125 = 250/200 * 100

C_NEW_SHARES = C_OLD_SHARES + (T_NEW_AMT/T_OLD_AMT - 1) * T_OLD_SHARES
25 = 0 + (250/200 - 1) * 100

--- General rule for deposits ---

We have the following variables:

uint256 totalAmount
uint256 totalShares
mapping(address => uint256) userShares

When a user deposits, all three change like so:

user calls deposit(uint256 _amount)

percentIncrease = (totalAmount + _amount)/totalAmount - 1

totalAmount         = totalAmount + _amount
userShares[sender]  = userShares[sender] + percentIncrease * totalShares
totalShares         = totalShares + percentIncrease * totalShares

-- Test general rule --

A has 80 shares (entitled to 160 matic)
B has 20 shares (entitled to 40 matic)
T is 100 shares (200 matic)

Charlie deposits 50 WMATIC into the Staker

A has 80 shares (entitled to 160 matic)
B has 20 shares (entitled to 40 matic)
C has {userShares[C]} shares (entitled to ... matic)
T is {totalShares} shares ({totalAmount} matic)

percentIncrease = (200 + 250)/200 - 1 = 1.25 - 1 = 0.25

totalAmount = 200 + 50 = 250
userShares[C] = 0 + 0.25 * 100 = 25
totalShares = 100 + 0.25 * 100 = 125

--- General rule for withdrawals ---

withdrawal amount = userShares[sender]/totalShares * totalAmount

*/