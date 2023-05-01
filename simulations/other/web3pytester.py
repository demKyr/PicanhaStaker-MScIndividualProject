from web3 import Web3
from dotenv import load_dotenv
import os

load_dotenv()

w3 = Web3(Web3.HTTPProvider("https://goerli.infura.io/v3/8e3fcf337e6d4023a8c45fa96f384ccd"))

if w3.isConnected():
    print("-" * 50)
    print("Connection Successful")
    print("-" * 50)
else:
    print("Connection Failed")


private_key = os.getenv("PRIVATE_KEY")
myAddress = os.getenv("MY_ADDRESS")


contractAddress = os.getenv("CONTRACT_ADDRESS") 
contractAbi = os.getenv("CONTRACT_ABI")
# contractAddress = '0xbC30b4b57Ccf802D6dA5632A29058D248c827624'
# contractAbi = '[{"inputs":[{"internalType":"address","name":"_stakingTokenAddress","type":"address"},{"internalType":"address","name":"_stakeManagerContractAddress","type":"address"},{"internalType":"address","name":"_validatorContractAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_user","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"RewardsCompounded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_unbondNonce","type":"uint256"},{"indexed":false,"internalType":"address","name":"_user","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"WithdrawalRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_requestID","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[{"internalType":"uint256","name":"_shares","type":"uint256"}],"name":"amountFromShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_keeperAddress","type":"address"}],"name":"changeKeeper","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"compoundRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"keeperAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ownerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"pendingWithdrawals","outputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rescueFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"sharesFromAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakeManagerContractAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingTokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"validatorContractAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_unbondNonce","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawRequest","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}]'
# contractAddress = '0x507153Ec325AFEb5CfC9ecF0f93BFd748639783A'
# contractAbi = '[{"inputs":[{"internalType":"address","name":"_stakingTokenAddress","type":"address"},{"internalType":"address","name":"_stakeManagerContractAddress","type":"address"},{"internalType":"address","name":"_validatorShareContractAddress","type":"address"},{"internalType":"address","name":"_treasuryAddress","type":"address"},{"internalType":"uint256","name":"_rewardFee","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_user","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"RewardsCompounded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_unbondNonce","type":"uint256"},{"indexed":false,"internalType":"address","name":"_user","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"WithdrawalRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_requestID","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[{"internalType":"uint256","name":"_shares","type":"uint256"}],"name":"amountFromShares","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"compoundRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getDust","outputs":[{"internalType":"uint256","name":"dust","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUnstakedRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ownerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"pendingWithdrawals","outputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rescueFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_treasuryAddress","type":"address"}],"name":"setTreasury","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"sharePrice","outputs":[{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint256","name":"precision","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"sharesFromAmount","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakeManagerContractAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingTokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"test","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"treasuryAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"validatorShareContractAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_unbondNonce","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawRequest","outputs":[{"internalType":"uint256","name":"unbondNonce","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}]'
contractInstance = w3.eth.contract(address=contractAddress, abi=contractAbi)



maticAddress = '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae'
maticAbi = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"mint","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isMinter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"MinterAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"MinterRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"}]'
maticInstance = w3.eth.contract(address=maticAddress, abi=maticAbi)


# changeKeeper(address _keeperAddress) public
# tx_hash = contractInstance.functions.changeKeeper('0x7c8e6864f34c1Ce9e8D92e083f0937DB07581AB8').transact({'from': '0x7c8e6864f34c1Ce9e8D92e083f0937DB07581AB8'})

# # sharesFromAmount(uint256 _amount) public view returns (uint256)
# print(contractInstance.functions.sharesFromAmount(100).call())

# # amountFromShares(uint256 _shares) public view returns (uint256)
# print(contractInstance.functions.amountFromShares(100).call())






# deposit(uint256 _amount) public
def test_deposit(transcationAmount = 5000000000000000):
    nonce = w3.eth.getTransactionCount(myAddress)

    # print(contractInstance.functions.totalAmount().call())
    # print(contractInstance.functions.totalShares().call())
    # print(contractInstance.functions.sharesFromAmount(transcationAmount).call())
    # print(contractInstance.functions.userShares(myAddress).call())
    expFinalTotalAmount = contractInstance.functions.totalAmount().call() + transcationAmount
    expFinalTotalShares = contractInstance.functions.totalShares().call() + contractInstance.functions.sharesFromAmount(transcationAmount).call()

    print('Granting approval...')
    build_tx_hash0 = maticInstance.functions.approve(contractAddress, transcationAmount).buildTransaction({
        'from': myAddress, 
        'nonce': nonce
        })
    signed_tx0 = w3.eth.account.signTransaction(build_tx_hash0, private_key)
    tx_hash0 = w3.eth.sendRawTransaction(signed_tx0.rawTransaction)
    tx_receipt0 = w3.eth.wait_for_transaction_receipt(tx_hash0)
    if(tx_receipt0.status):
        print('Approval granted')

    print('Staking token...')
    build_tx_hash1 = contractInstance.functions.deposit(transcationAmount).buildTransaction({
        'from': myAddress, 
        'nonce': nonce + 1
        })
    signed_tx1 = w3.eth.account.signTransaction(build_tx_hash1, private_key)
    tx_hash1 = w3.eth.sendRawTransaction(signed_tx1.rawTransaction)
    tx_receipt1 = w3.eth.wait_for_transaction_receipt(tx_hash1)
    if(tx_receipt1.status):
        print('Deposit successful')

    # print(contractInstance.functions.totalAmount().call())
    # print(contractInstance.functions.totalShares().call())
    # print(contractInstance.functions.userShares(myAddress).call())
    if(expFinalTotalAmount == contractInstance.functions.totalAmount().call()):
        print("Total Amount updated successfully")
    if(expFinalTotalShares == contractInstance.functions.totalShares().call()):
        print("Total Shares updated successfully")

    return




# withdrawRequest(uint256 _amount) public returns (uint256)
def test_withdrawRequest(withdrawalAmount = 5000000000000000):
    # numOfShares = contractInstance.functions.userShares(myAddress).call()
    # withdrawalAmount = contractInstance.functions.amountFromShares(numOfShares).call()
    nonce = w3.eth.getTransactionCount(myAddress)

    # print(contractInstance.functions.totalAmount().call())
    # print(contractInstance.functions.totalShares().call())
    # print(contractInstance.functions.userShares(myAddress).call())
    expFinalTotalAmount = contractInstance.functions.totalAmount().call() - withdrawalAmount
    expFinalTotalShares = contractInstance.functions.totalShares().call() - contractInstance.functions.sharesFromAmount(withdrawalAmount).call()

    print('Submitting request')
    build_tx_hash1 = contractInstance.functions.withdrawRequest(withdrawalAmount).buildTransaction({
        'from': myAddress, 
        'nonce': nonce
        })
    signed_tx1 = w3.eth.account.signTransaction(build_tx_hash1, private_key)
    tx_hash1 = w3.eth.sendRawTransaction(signed_tx1.rawTransaction)
    # print(tx_hash1)
    tx_receipt1 = w3.eth.wait_for_transaction_receipt(tx_hash1)
    # print(tx_receipt1)
    rich_logs = contractInstance.events.WithdrawalRequested().processReceipt(tx_receipt1)
    # print(rich_logs)
    if(tx_receipt1.status):
        print('Submission successful with unbondNonce:', rich_logs[0]['args']['_unbondNonce'])

    # print(contractInstance.functions.totalAmount().call())
    # print(contractInstance.functions.totalShares().call())
    # print(contractInstance.functions.userShares(myAddress).call())
    if(expFinalTotalAmount == contractInstance.functions.totalAmount().call()):
        print("Total Amount updated successfully")
    if(expFinalTotalShares == contractInstance.functions.totalShares().call()):
        print("Total Shares updated successfully")



# withdraw(uint256 _unbondNonce) public
def test_withdraw(unbondNonce):
    nonce = w3.eth.getTransactionCount(myAddress)

    print('Withdrawing...')
    build_tx_hash1 = contractInstance.functions.withdraw(unbondNonce).buildTransaction({
        'from': myAddress, 
        'nonce': nonce
        })
    signed_tx1 = w3.eth.account.signTransaction(build_tx_hash1, private_key)
    tx_hash1 = w3.eth.sendRawTransaction(signed_tx1.rawTransaction)
    tx_receipt1 = w3.eth.wait_for_transaction_receipt(tx_hash1)
    if(tx_receipt1.status):
        print('Withdrawal successful')





#%%

# test_deposit(5000000000000000)
# log_info = test_withdrawRequest(5000000000000000)
# test_withdraw(7)
# print(contractInstance.functions.totalAmount().call())
print('Share price:',contractInstance.functions.sharePrice().call())
print('Dust:',contractInstance.functions.getDust().call())



# %%
