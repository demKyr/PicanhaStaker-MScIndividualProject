// SPDX-License-Identifier: GPL-3.0
// The code outside the <TruStake Picanha></TruStake Picanha> tags constitutes pre-existing code from TruStakeMATIC.
// The code within <TruStake Picanha></TruStake Picanha> tags was written by Demetris Kyriacou for the TruStake Picanha vault.

pragma solidity =0.8.19;

// OpenZeppelin
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {MathUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

// Polygon
import {IValidatorShare} from "../interfaces/IValidatorShare.sol";
import {IStakeManager} from "../interfaces/IStakeManager.sol";

// TruFin
import {ITruStakeMATICv2} from "../interfaces/ITruStakeMATICv2.sol";
import {TruStakeMATICv2Storage} from "./TruStakeMATICv2Storage.sol";
import {Request, IndirectWithdrawal} from "./Types.sol";   
import {Queue} from "./QueueWithMap.sol";   

// Debugging
import "hardhat/console.sol";

uint256 constant PHI_PRECISION = 1e4;
uint256 constant MAX_EPSILON = 1e12;

/// @title TruStakeMATICv2
/// @notice An auto-compounding liquid staking MATIC vault with reduced gas fees.
contract TruStakeMATICv2 is
    TruStakeMATICv2Storage,
    ITruStakeMATICv2,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC4626Upgradeable
{
    // *** LIBRARIES ***

    using SafeERC20Upgradeable for IERC20Upgradeable;

    // *** CONSTRUCTOR & INITIALIZER ***

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Vault state initializer.
    /// @param _stakingTokenAddress MATIC token address.
    /// @param _stakeManagerContractAddress Polygon's StakeManager contract address.
    /// @param _validatorShareContractAddress Share contract of the validator the vault delegates to.
    /// @param _phi Fee taken on restake in basis points.
    /// @param _cap Limit placed on combined vault deposits.
    /// @param _depositFee Fee taken on deposits in basis points.
    /// @param _withdrawalFee Fee taken on withdrawals in basis points.
    /// @param _minDepositAmount Minimum deposit amount.
    /// @param _minWithdrawalAmount Minimum withdrawal amount.
    /// @param _expiryPeriod Period of time after which a request expires.
    /// @param _dQueueThreshold Threshold for the deposit queue.
    /// @param _wQueueThreshold Threshold for the withdrawal queue.
    
    function initialize(
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
    ) external initializer {
        // Initialize derived state
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC4626_init(IERC20Upgradeable(_stakingTokenAddress));
        __ERC20_init("TruStake MATIC Vault Shares", "TruMATIC");

        // Ensure addresses are non-zero
        _checkNotZeroAddress(_stakingTokenAddress);
        _checkNotZeroAddress(_stakeManagerContractAddress);
        _checkNotZeroAddress(_validatorShareContractAddress);
        _checkNotZeroAddress(_treasuryAddress);

        if (_phi > PHI_PRECISION) {
            revert PhiTooLarge();
        }

        // Initialize contract state
        stakingTokenAddress = _stakingTokenAddress;
        stakeManagerContractAddress = _stakeManagerContractAddress;
        validatorShareContractAddress = _validatorShareContractAddress;
        treasuryAddress = _treasuryAddress;
        phi = _phi;
        cap = _cap;
        epsilon = 1e4;
        // -------------------------- <TruStake Picanha> ---------------------------
        depositFee = _depositFee; 
        withdrawalFee = _withdrawalFee;
        minDepositAmount = _minDepositAmount;
        minWithdrawalAmount = _minWithdrawalAmount;
        expiryPeriod = _expiryPeriod;
        dQueueThreshold = _dQueueThreshold;
        wQueueThreshold = _wQueueThreshold;
        // depositFee = 10;                   
        // withdrawalFee = 10;                
        // minDepositAmount = 100 * 1e18;     
        // minWithdrawalAmount = 100 * 1e18;  
        // expiryPeriod = 7 * 86400;          
        // dQueueThreshold = 15000 * 1e18;    
        // wQueueThreshold = 15000 * 1e18;    

        dQueue = new Queue();
        wQueue = new Queue();
        // -------------------------- </TruStake Picanha> --------------------------

        emit StakerInitialized(
            _stakingTokenAddress,
            _stakeManagerContractAddress,
            _validatorShareContractAddress,
            _treasuryAddress,
            _phi,
            _cap,
            _depositFee,
            _withdrawalFee,
            _minDepositAmount,
            _minWithdrawalAmount,
            _expiryPeriod,
            _dQueueThreshold,
            _wQueueThreshold
        );
    }

    // **************************************** VIEW FUNCTIONS ****************************************

    /// @notice Gets the total amount of MATIC currently staked by the vault.
    /// @return Total amount of MATIC staked by the vault via validator delegation.
    function totalStaked() public view returns (uint256) {
        (uint256 stake,) = IValidatorShare(validatorShareContractAddress).getTotalStake(address(this));
        return stake;
    }

    /// @notice Gets the vault's unclaimed MATIC rewards.
    /// @return Amount of liquid claimable MATIC earned through validator delegation.
    function totalRewards() public view returns (uint256) {
        return IValidatorShare(validatorShareContractAddress).getLiquidRewards(address(this));
    }

    /// @notice Gets the current epoch from Polygons's StakeManager contract.
    /// @return Current Polygon epoch.
    function getCurrentEpoch() public view returns (uint256) {
        return IStakeManager(stakeManagerContractAddress).epoch();
    }

    /// @notice Gets the maximum amount of MATIC a user could deposit into the vault.
    /// @dev maxDeposit is independent of the user, so while an address is passed in for ERC4626
    /// compliance, it is never used.
    /// @return The amount of MATIC.
    function maxDeposit(address) public view override returns (uint256) {
        uint256 totalStakedMATIC = totalStaked();

        if (totalStakedMATIC >= cap) return 0;

        return cap - totalStakedMATIC;
    }

    // -------------------------- <TruStake Picanha> ---------------------------
    /// @notice Gets the maximum amount of MATIC a user can withdraw from the vault.
    /// @param _user The user under consideration.
    /// @return The amount of MATIC.
    function maxWithdraw(address _user) public view override returns (uint256) {
        // uint256 preview = previewRedeem(maxRedeem(_user));
        uint256 preview = toAssets(balanceOf(_user)) + preshares[_user]; 

        if (preview == 0) {
            return 0;
        }

        return preview;
        // return preview + epsilon;
    }

    /// @notice Gets the price of one TruMATIC share in MATIC.
    /// @dev Represented via a fraction. Factor of 1e18 included in numerator to avoid rounding errors (currently redundant).
    /// @return globalPriceNum Numerator of the vault's share price fraction.
    /// @return globalPriceDenom Denominator of the vault's share price fraction.
    function sharePrice() public view returns (uint256, uint256) {
        if (totalSupply() == 0) return (1e18, 1);
        uint256 totalCapitalTimesPhiPrecision = (totalStaked() + totalAssets() - dQueueBalance - wQueueBalance) *
            PHI_PRECISION +
            (PHI_PRECISION - phi) *
            totalRewards();

        // Calculate share price fraction components
        uint256 globalPriceNum = totalCapitalTimesPhiPrecision * 1e18;
        uint256 globalPriceDenom = totalSupply() * PHI_PRECISION;

        return (globalPriceNum, globalPriceDenom);
    }

    // *** SETTERS ***
    /// @notice Sets the parameters of the vault
    function setParameters(
                uint256 _cap,
                uint256  _depositFee, 
                uint256 _withdrawalFee, 
                uint256 _minDepositAmount, 
                uint256 _minWithdrawalAmount, 
                uint256 _expiryPeriod, 
                uint256 _dQueueThreshold, 
                uint256 _wQueueThreshold
                ) external onlyOwner(){
        cap = _cap;
        depositFee = _depositFee;                  
        withdrawalFee = _withdrawalFee;               
        minDepositAmount = _minDepositAmount;    
        minWithdrawalAmount = _minWithdrawalAmount; 
        expiryPeriod = _expiryPeriod;         
        dQueueThreshold = _dQueueThreshold;   
        wQueueThreshold = _wQueueThreshold;   
    }

    // *** GETTERS ***

    /// @notice Gets the amount of preshares of a user.
    /// @param _user Address of the user.
    function getUserPreshares(address _user) public view returns (uint256) {
        return preshares[_user];
    }

    // *** CHECKERS ***

    /// @notice Checks if the unbond specified via the input nonce can be claimed from the delegator.
    /// @param _unbondNonce Nonce of the unbond under consideration.
    /// @return Boolean indicating whether the unbond can be claimed.
    function isClaimable(uint256 _unbondNonce) external view returns (bool) {
        // Get epoch at which unbonding of delegated MATIC was initiated
        (, uint256 withdrawEpoch) = IValidatorShare(validatorShareContractAddress).unbonds_new(
            address(this),
            _unbondNonce
        );

        // Check required epochs have passed
        bool epochsPassed = getCurrentEpoch() >= withdrawEpoch + IStakeManager(stakeManagerContractAddress).withdrawalDelay();

        bool withdrawalPresent = indirectUnbondingWithdrawals[_unbondNonce].last != 0;

        return withdrawalPresent && epochsPassed;
    }

    // **************************************** STATE-CHANGING FUNCTIONS ****************************************

    /// @notice Indirectly deposits an amount of caller->-vault approved MATIC into the dQueue of the vault.
    /// @param _assets The amount of MATIC to deposit.
    /// @param _receiver The address to receive TruMATIC shares (must be caller to avoid reversion).
    /// @return The resulting amount of TruMATIC shares minted to the caller (receiver).
    function indirectDeposit(uint256 _assets, address _receiver) public nonReentrant returns (uint256) {
        if (msg.sender != _receiver) {
            revert SenderAndOwnerMustBeReceiver();
        }

        _indirectDeposit(msg.sender, _assets);

        emit IndirectDepositEvent(msg.sender, _assets);

        return previewDeposit(_assets);
    }

    /// @notice Directly deposits an amount of caller->-vault approved MATIC into the vault and processes the whole dQueue.
    /// @param _assets The amount of MATIC to deposit.
    /// @param _receiver The address to receive TruMATIC shares (must be caller to avoid reversion).
    /// @return The resulting amount of TruMATIC shares minted to the caller (receiver).
    function directDeposit(uint256 _assets, address _receiver) public nonReentrant returns (uint256) {
        if (msg.sender != _receiver) {
            revert SenderAndOwnerMustBeReceiver();
        }

        _directDeposit(msg.sender, _assets);

        emit DirectDepositEvent(msg.sender, _assets);

        return previewDeposit(_assets);
    }

    /// @notice Initiates an indirect withdrawal request for an amount of MATIC from the vault and burns corresponding TruMATIC shares.
    /// @param _assets The amount of MATIC to withdraw.
    /// @param _receiver The address to receive the MATIC (must be caller to avoid reversion).
    /// @param _user The address whose shares are to be burned (must be caller to avoid reversion).
    /// @return The resulting amount of TruMATIC shares burned from the caller (owner).
    function indirectWithdrawRequest(
        uint256 _assets,
        address _receiver,
        address _user
    ) public nonReentrant returns (uint256) {
        if (msg.sender != _receiver || msg.sender != _user) {
            revert SenderAndOwnerMustBeReceiver();
        }

        _indirectWithdrawRequest(msg.sender, _assets);

        emit IndirectWithdrawalEvent(msg.sender, _assets);

        return previewWithdraw(_assets);
    }

    /// @notice Initiates an direct withdrawal request for an amount of MATIC from the vault and burns corresponding TruMATIC shares.
    /// @param _assets The amount of MATIC to withdraw.
    /// @param _receiver The address to receive the MATIC (must be caller to avoid reversion).
    /// @param _user The address whose shares are to be burned (must be caller to avoid reversion).
    /// @return The resulting amount of TruMATIC shares burned from the caller (owner).
    function directWithdrawRequest(
        uint256 _assets,
        address _receiver,
        address _user
    ) public nonReentrant returns (uint256) {
        if (msg.sender != _receiver || msg.sender != _user) {
            revert SenderAndOwnerMustBeReceiver();
        }

        _directWithdrawRequest(msg.sender, _assets);

        emit DirectWithdrawalEvent(msg.sender, _assets);

        return previewWithdraw(_assets);
    }

    /// @notice Executes staking process of the dQueue.
    function indirectStake() external nonReentrant {
        _indirectStake();
    }

    /// @notice Executes unstaking process of the wQueue.
    function indirectUnstakeRequest() external nonReentrant {
        _indirectUnstakeRequest();
    }

    /// @notice Claims a previous requested and now unbonded withdrawal.
    /// @param _unbondNonce Nonce of the corresponding delegator unbond.
    function indirectUnstakeClaim(uint256 _unbondNonce) external nonReentrant {
        _indirectUnstakeClaim(_unbondNonce);
    }

    /// @notice Checks for expired requests and emits events if needed.
    function expiryCheck() external nonReentrant {
        _expiryCheck();
    }

    // **************************************** PRIVATE FUNCTIONS ****************************************

    // *** PRIMARY PRIVATE FUNCTIONS ***
    
    /// @notice Internal indirect deposit function which adds deposit request to dQueue
    /// @param _user user indirectly depositing the amount
    /// @param _amount to be indirectly deposited
    function _indirectDeposit(address _user, uint256 _amount) private {
        if (_amount < minDepositAmount && _amount > 0) {
            revert DepositUnderMinDirectDepositAmount();
        }

        if (_amount > maxDeposit(_user)) {
            revert DepositSurpassesVaultCap();
        }

        // get share price before transfer
        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();

        // transfer staking token from user to Staker plus the deposit fee
        uint256 depositFeeAmount = _amount * depositFee / PHI_PRECISION;
        uint256 totalDepositAmount = _amount + depositFeeAmount;
        IERC20Upgradeable(stakingTokenAddress).safeTransferFrom(_user, address(this), totalDepositAmount);

        // increase dQueue balance
        dQueueBalance += _amount;

        // mint Tsy shares for deposit fees
        uint256 shareIncreaseTsy = (depositFeeAmount * globalPriceDenom * 1e18) / globalPriceNum;
        _mint(treasuryAddress, shareIncreaseTsy);

        // mint preshares for the user
        if (_user != address(0)) {
            preshares[_user] += _amount;
        }

        // add deposit request to dQueue
        dQueue.enqueue(Request(_user, _amount, block.timestamp + expiryPeriod, false));

        if (wQueue.isEmpty()) {
            if (dQueueBalance >= dQueueThreshold){
                // balance in dQueue has reached threshold, execute staking process
                // _indirectStake() should be called by protocol, not the user
                emit StakeRequired();
            }
        }
        else{
            // both queues contain requests, execute netting process
            _pairQueues();
        }
        // check for expired requests
        _expiryCheck();
    }

    /// @notice Internal direct deposit function
    /// @param _user user directly depositing the amount
    /// @param _amount to be directly deposited
    function _directDeposit(address _user, uint256 _amount) private {
        if (_amount < 1e18 && _amount > 0) {
            revert DepositUnderOneMATIC();
        }

        if (_amount > maxDeposit(_user)) {
            revert DepositSurpassesVaultCap();
        }

        // transfer staking token from user to Staker
        IERC20Upgradeable(stakingTokenAddress).safeTransferFrom(_user, address(this), _amount);

        // increase dQueue balance
        dQueueBalance += _amount;

        // mint preshares for the user
        if (_user != address(0)) {
            preshares[_user] += _amount;
        }

        // add deposit request to dQueue
        dQueue.enqueue(Request(_user, _amount, block.timestamp + expiryPeriod, false));

        // process request along with all the requests in the dQueue
        // first pair queues
        if (! wQueue.isEmpty()) {
            _pairQueues();
        }
        // then stake whatever was not netted
        if (wQueue.isEmpty()){
            _indirectStake();
        }
        
    }

    /// @notice Utility function to handle indirect withdrawals, first deducting from preshares and then adding to wQueue
    /// @param _user to indirectly withdraw from and receiving the amount
    /// @param _amount to be indirectly withdrawn
    function _indirectWithdrawRequest(address _user, uint256 _amount) private {
        if (_amount == 0) {
            revert WithdrawalRequestAmountCannotEqualZero();
        }

        if (_amount < minWithdrawalAmount) {
            revert DirectWithdrawalRequestAmountBelowMin();
        }

        if (_amount > maxWithdraw(_user)) {
            revert WithdrawalAmountTooLarge();
        }

        uint256 requestAmount = _amount;
        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();

        // if user has preshares, deduct from preshares first
        if(preshares[_user] > 0){
            if (preshares[_user] >= _amount){
                preshares[_user] -= _amount;
                _reduceDRequests(_user, _amount);
                // send _amount minus withdrawal fee to the user 
                uint256 withdrawalFeeAmount = _amount * withdrawalFee / PHI_PRECISION;
                uint256 totalWithdrawalAmount = _amount - withdrawalFeeAmount;
                IERC20Upgradeable(stakingTokenAddress).safeTransfer(msg.sender, totalWithdrawalAmount);
                // mint Tsy shares for withdrawal fees
                uint256 shareIncreaseTsy = (withdrawalFeeAmount * globalPriceDenom * 1e18) / globalPriceNum;
                _mint(treasuryAddress, shareIncreaseTsy);
                return;
            }
            else{
                requestAmount = _amount - preshares[_user];
                _reduceDRequests(_user,preshares[_user]);
                // send full amount from preshares minus withdrawal fee to the user 
                uint256 withdrawalFeeAmount = preshares[_user] * withdrawalFee / PHI_PRECISION;
                uint256 totalWithdrawalAmount = preshares[_user] - withdrawalFeeAmount;
                IERC20Upgradeable(stakingTokenAddress).safeTransfer(msg.sender, totalWithdrawalAmount);
                // mint Tsy shares for withdrawal fees
                uint256 shareIncreaseTsy = (withdrawalFeeAmount * globalPriceDenom * 1e18) / globalPriceNum;
                _mint(treasuryAddress, shareIncreaseTsy);
                preshares[_user] = 0;
            }
        }

        // burn shares
        uint256 shareDecreaseUser = (requestAmount * globalPriceDenom * 1e18) / globalPriceNum;
        uint256 maxWithdrawal = maxWithdraw(_user);
        // If remaining user balance is below 1 MATIC, entire balance is withdrawn and all shares 
        // are burnt. We allow the user to withdraw their deposited amount + epsilon
        uint256 remainingBalance = maxWithdrawal - requestAmount; 
        if (remainingBalance < 1e18){
            requestAmount = maxWithdrawal;
            shareDecreaseUser = balanceOf(_user);
        }
        _burn(_user, shareDecreaseUser);

        // increase wQueue balance
        wQueueBalance += requestAmount;

        // add withdrawal request to dQueue
        wQueue.enqueue(Request(_user, requestAmount, block.timestamp + expiryPeriod, false));

        if (dQueue.isEmpty()) {
            if (wQueueBalance >= wQueueThreshold){
                // balance in wQueue has reached threshold, execute unstaking process
                // _indirectUnstakeRequest() should be called by protocol, not the user 
                emit UnstakeRequired();
            }
        }
        else{
            // both queues contain requests, execute netting process
            _pairQueues();
        }
        // check for expired requests
        _expiryCheck();
    }

    /// @notice Utility function to handle direct withdrawals, first deducting from preshares and then adding to wQueue and processing the whole queue
    /// @param _user to directly withdraw from and receiving the amount
    /// @param _amount to be directly withdrawn
    function _directWithdrawRequest(address _user, uint256 _amount) private {
        if (_amount == 0) {
            revert WithdrawalRequestAmountCannotEqualZero();
        }

        if (_amount > maxWithdraw(_user)) {
            revert WithdrawalAmountTooLarge();
        }

        uint256 requestAmount = _amount;

        // if user has preshares, deduct from preshares first
        if(preshares[_user] > 0){
            if (preshares[_user] >= _amount){
                preshares[_user] -= _amount;
                _reduceDRequests(_user, _amount);
                // send _amount to the user 
                IERC20Upgradeable(stakingTokenAddress).safeTransfer(_user, _amount);
                return;
            }
            else{
                requestAmount = _amount - preshares[_user];
                _reduceDRequests(_user,preshares[_user]);
                // send full amount from preshares to the user
                IERC20Upgradeable(stakingTokenAddress).safeTransfer(_user, preshares[_user]);
                preshares[_user] = 0;
            }
        }

        // burn shares
        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();
        uint256 shareDecreaseUser = (requestAmount * globalPriceDenom * 1e18) / globalPriceNum;
        uint256 maxWithdrawal = maxWithdraw(_user);
        // If remaining user balance is below 1 MATIC, entire balance is withdrawn and all shares 
        // are burnt. We allow the user to withdraw their deposited amount + epsilon
        uint256 remainingBalance = maxWithdrawal - requestAmount; 
        if (remainingBalance < 1e18){
            requestAmount = maxWithdrawal;
            shareDecreaseUser = balanceOf(_user);
        }
        _burn(_user, shareDecreaseUser);

        // increase wQueue balance
        wQueueBalance += requestAmount;

        // add withdrawal request to dQueue
        wQueue.enqueue(Request(_user, requestAmount, block.timestamp + expiryPeriod, true));

        // process request along with all the requests in the wQueue
        // first pair queues
        if (! dQueue.isEmpty()) {
            _pairQueues();
        }
        // then unstake whatever was not netted
        if (dQueue.isEmpty()) {
            _indirectUnstakeRequest();
        }
    }

    // *** AUXILIARY PRIVATE FUNCTIONS ***

    /// @notice Utility function to reduce amount from a user's pending dQueue requests
    /// @param _user to reduce requests from
    /// @param _amount to be reduced
    function _reduceDRequests(address _user, uint256 _amount) private {
        uint256 idx = dQueue.first();
        uint256 remainingAmount = _amount;
        while (idx < dQueue.last() && remainingAmount > 0){
            if (dQueue.getUser(idx) == _user){
                if (dQueue.getAmount(idx) > remainingAmount){
                    dQueue.reduceAmount(idx, remainingAmount);
                    remainingAmount = 0;
                }
                else{
                    remainingAmount -= dQueue.getAmount(idx);
                    if (idx == dQueue.first()){
                        dQueue.dequeue();
                    }
                    else{
                        dQueue.clearAmount(idx);
                    }
                }
            }
            idx++;
        }
        dQueueBalance -= _amount - remainingAmount; // at this point remainingAmount should be 0
    }   

    /// @notice Utility function to check for expired requests and initiate staking / unstaking process if needed
    function _expiryCheck() private {
        if (! dQueue.isEmpty() && dQueue.getExpiryDate(dQueue.first()) < block.timestamp){
            // if oldest request is empty because of reduction, dequeue and call fuction again
            if (dQueue.getAmount(dQueue.first()) == 0){
                dQueue.dequeue();
                _expiryCheck();
            }
            else{
                // _indirectStake() should be called by protocol, not the user 
                emit StakeRequired();
            }
        }
        if (! wQueue.isEmpty() && wQueue.getExpiryDate(wQueue.first())< block.timestamp){
            // _indirectUnstakeRequest() should be called by protocol, not the user 
            emit UnstakeRequired();
        }
    }

    /// @notice Function that nets requests from the two queue until one is empty
    function _pairQueues() private {
        if (dQueue.isEmpty() || wQueue.isEmpty()){
            return;
        }

        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();

        //calculate amount of netting transaction
        uint256 nettingAmount;
        uint256 dQueueFirstAmount = dQueue.getAmount(dQueue.first());
        uint256 wQueueFirstAmount = wQueue.getAmount(wQueue.first());
        address dQueueFirstUser = dQueue.getUser(dQueue.first());
        address wQueueFirstUser = wQueue.getUser(wQueue.first());
        if (dQueueFirstAmount < wQueueFirstAmount){
            nettingAmount = dQueueFirstAmount;
        }
        else {
            nettingAmount = wQueueFirstAmount;
        }

        // mint shares for dQueue user
        if (dQueueFirstUser != address(0)){
            uint256 shareIncreaseUser = _convertToSharesGivenSharePrice(nettingAmount, globalPriceNum, globalPriceDenom,  MathUpgradeable.Rounding.Down);
            _mint(dQueueFirstUser, shareIncreaseUser);
        }
        dQueueBalance -= nettingAmount;

        // burn preshares of dQueue user
        preshares[dQueueFirstUser] -= nettingAmount;

        // transfer amount of MATIC from dQueue to wQueue user
        if (wQueue.getIsDirectWithdraw(wQueue.first())){
            IERC20Upgradeable(stakingTokenAddress).safeTransfer(wQueueFirstUser, nettingAmount);
        }
        else {
            uint256 withdrawalFeeAmount = nettingAmount * withdrawalFee / PHI_PRECISION;
            uint256 totalWithdrawalAmount = nettingAmount - withdrawalFeeAmount;
            IERC20Upgradeable(stakingTokenAddress).safeTransfer(wQueueFirstUser, totalWithdrawalAmount);
            uint256 shareIncreaseTsy = (withdrawalFeeAmount * globalPriceDenom * 1e18) / globalPriceNum;
            _mint(treasuryAddress, shareIncreaseTsy); 
        }
        wQueueBalance -= nettingAmount;

        // update queues
        if (dQueueFirstAmount < wQueueFirstAmount){
            dQueue.dequeue();
            wQueue.reduceAmount(wQueue.first(), nettingAmount);
        }
        else if (dQueueFirstAmount > wQueueFirstAmount){
            dQueue.reduceAmount(dQueue.first(), nettingAmount);
            wQueue.dequeue();
        }
        else {
            dQueue.dequeue();
            wQueue.dequeue();
        }

        _pairQueues();
    }

    // *** INTERACTION WITH VALIDATOR NODE ***

    /// @notice Utility function to execute staking process of the dQueue
    function _indirectStake() private {
        // check if dQueue is empty
        if (dQueue.isEmpty()){
            return;
        }

        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();

        // mint shares and burn preshares for users in dQueue
        while(! dQueue.isEmpty()){
            (address requestUser, uint256 requestAmount, , ) = dQueue.dequeue();
            preshares[requestUser] -= requestAmount;
            if (preshares[requestUser] < 1e18){
                preshares[requestUser] = 0;
            }
            if (requestUser != address(0)){
                uint256 shareIncreaseUser = _convertToSharesGivenSharePrice(requestAmount, globalPriceNum, globalPriceDenom,  MathUpgradeable.Rounding.Down);
                _mint(requestUser, shareIncreaseUser);
            }
        }

        // mint shares for the treasury from rewards 
        uint256 shareIncreaseTsy = (totalRewards() * phi * 1e18 * globalPriceDenom) / (globalPriceNum * PHI_PRECISION);
        _mint(treasuryAddress, shareIncreaseTsy);

        // approve funds (_amount + deposit/withdrawal fees + rewards) to Stake Manager
        IERC20Upgradeable(stakingTokenAddress).safeIncreaseAllowance(stakeManagerContractAddress, totalAssets());

        // interact with Validator Share contract to stake 
        _stake(totalAssets());
        dQueueBalance = 0;
    }

    /// @notice Utility function to execute unstaking process of the wQueue
    function _indirectUnstakeRequest() private{

        // mint shares for the treasury from rewards
        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();
        uint256 shareIncreaseTsy = (totalRewards() * phi * 1e18 * globalPriceDenom) / (globalPriceNum * PHI_PRECISION);
        _mint(treasuryAddress, shareIncreaseTsy);

        // interact with staking contract to initiate unbonding 
        uint256 amount = wQueueBalance;
        if(amount > totalStaked()){
            amount = totalStaked();
        }
        latestUnbondingNonce = _unbond(amount);
        wQueueBalance = 0;

        // emit event with unbond nonce 
        emit UnbondNonceCreated(latestUnbondingNonce,getCurrentEpoch());

        // store unbond nonce and clear wQueue
        indirectUnbondingWithdrawals[latestUnbondingNonce] = IndirectWithdrawal(wQueue.first(), wQueue.last());
        wQueue.refresh();

    }

    /// @notice Function that claims withdrawals internally according to unbond nonce (once unbonding period has passed) and sends MATIC to users
    /// @param _unbondNonce the ticket from initiating the withdrawal
    function _indirectUnstakeClaim(uint256 _unbondNonce) private {
        IndirectWithdrawal storage indirectWithdrawal = indirectUnbondingWithdrawals[_unbondNonce];
        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();

        // claim will revert if unbonding not finished for this unbond nonce
        _claimStake(_unbondNonce);

        uint256 amountIncreaseTsy = 0;

        // send MATIC to users in wQueue
        for (uint256 idx = indirectWithdrawal.first; idx < indirectWithdrawal.last; idx++){
            (address requestUser, uint256 requestAmount, , bool requestIsDirectWithdraw) = wQueue.deleteElement(idx);

            // send MATIC to users
            if (requestIsDirectWithdraw){
                IERC20Upgradeable(stakingTokenAddress).safeTransfer(requestUser, requestAmount);
            }
            else{
                uint256 withdrawalFeeAmount = requestAmount * withdrawalFee / PHI_PRECISION;
                uint256 totalWithdrawalAmount = requestAmount - withdrawalFeeAmount;
                IERC20Upgradeable(stakingTokenAddress).safeTransfer(requestUser, totalWithdrawalAmount);
                amountIncreaseTsy += withdrawalFeeAmount;
            }
        }
        delete indirectUnbondingWithdrawals[_unbondNonce];

        // mint Tsy shares for withdrawal fees
        uint256 shareIncreaseTsy = (amountIncreaseTsy * globalPriceDenom * 1e18) / globalPriceNum;
        _mint(treasuryAddress, shareIncreaseTsy);

        // emit event with unbond nonce 
        emit UnbondNonceClaimed(_unbondNonce);
    }

    // *** CONVERTERS ***

    /// @notice internal function to convert MATIC to TruMATIC using given share price
    /// @param assets in MATIC to be converted into TruMATIC
    /// @param _globalPriceNum share price numerator
    /// @param _globalPriceDenom share price denominator
    function _convertToSharesGivenSharePrice(
        uint256 assets,
        uint256 _globalPriceNum,
        uint256 _globalPriceDenom,
        MathUpgradeable.Rounding rounding
    ) internal pure returns (uint256 shares) {
        shares =  MathUpgradeable.mulDiv(assets * 1e18, _globalPriceDenom, _globalPriceNum, rounding);
    }

    function toAssets(uint256 _shares) public view returns (uint256) {
        return (_convertToAssets(_shares,MathUpgradeable.Rounding.Down));
    }
    // -------------------------- </TruStake Picanha> --------------------------

    /// @notice Validator function that transfers the _amount to the stake manager and stakes the assets onto the validator.
    /// @param _amount amount of MATIC to stake.
    function _stake(uint256 _amount) private {
        IValidatorShare(validatorShareContractAddress).buyVoucher(_amount, _amount);
    }

    /// @notice Requests that the validator share contract unstakes a certain amount of MATIC.
    /// @param _amount the amount of MATIC to initiate the unstaking of.
    function _unbond(uint256 _amount) private returns (uint256 unbondNonce) {
        IValidatorShare(validatorShareContractAddress).sellVoucher_new(_amount, _amount);

        unbondNonce = IValidatorShare(validatorShareContractAddress).unbondNonces(address(this));
    }

    /// @notice Internal function for claiming the MATIC from a withdrawal request made previously.
    /// @param _unbondNonce the unbond nonce of the withdrawal request being claimed.
    function _claimStake(uint256 _unbondNonce) private {
        IValidatorShare(validatorShareContractAddress).unstakeClaimTokens_new(_unbondNonce);
    }

    /// @notice Calls the validator share contract's restake functionality to turn earned rewards into staked MATIC.
    function _restake() private {
        IValidatorShare(validatorShareContractAddress).restake();
    }

    /// @notice Checks whether an address is the zero address.
    /// @dev Gas-efficient way to check using assembly.
    /// @param toCheck address to be checked.
    function _checkNotZeroAddress(address toCheck) private pure {
        assembly {
            //more gas efficient to use assembly for zero address check
            if iszero(toCheck) {
                let ptr := mload(0x40)
                mstore(ptr, 0x1cb411bc00000000000000000000000000000000000000000000000000000000) // selector for `ZeroAddressNotSupported()`
                revert(ptr, 0x4)
            }
        }
    }

    /// @notice internal function to convert TruMATIC to MATIC
    /// @param shares TruMATIC shares to be converted into MATIC
    function _convertToAssets(
        uint256 shares,
        MathUpgradeable.Rounding rounding
    ) internal view override returns (uint256 assets) {
        (uint256 globalPriceNum, uint256 globalPriceDenom) = sharePrice();
        assets = MathUpgradeable.mulDiv(shares, globalPriceNum, globalPriceDenom * 1e18, rounding);
    }

    // We override this function as we want to block users from transferring strict allocations and associated rewards.
    // We avoid using the _beforeTokenTransfer hook as we wish to utilise unblocked super._transfer functionality in reward distribution.
    function _transfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && amount > maxRedeem(from)) {
            revert ExceedsUnallocatedBalance();
        }

        super._transfer(from, to, amount);
    }

    /// @notice Function that returns everything to the owner 
    // !!!! ONLY FOR TESTNETS, SHOULD BE REMOVED IF DEPLOYED ON MAINNET !!!!
    function rescueFunds() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
        IERC20Upgradeable(stakingTokenAddress).safeTransfer(msg.sender, IERC20Upgradeable(stakingTokenAddress).balanceOf(address(this)));
    }
}
