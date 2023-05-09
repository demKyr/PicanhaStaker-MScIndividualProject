#%%

from D_queueUsingDictionary import queue
from datetime import datetime


# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
currentTimestamp = datetime.timestamp(datetime.now())

# Adjustable constants
fee = 0.1                # Fee on rewards
depositFee = 0.001 # 0.1%
withdrawFee = 0.001 # 0.1%
DqueueThreshold = stakeFee / depositFee
WqueueThreshold = unstakeFee / withdrawFee
expiryPeriod = 7 * 86400 # 7 days


class request:
    def __init__(self, user, amount):
        self.user = user
        self.amount = amount
        self.expirydate = currentTimestamp + expiryPeriod


# Simulation parameters
Dqueue = queue()
Wqueue = queue()
shares = {}
preshares = {}
VaultBalances = {"ValidatorAmount": 0, 
                 "VaultAmount": 0,
                 "rewards": 0,
                 "claimedRewards":0,
                 "TotalShares":0,
                 "DqueueTotal":0,
                 "WqueueTotal":0
                }


def XPY (days):
    return (1+DPY)**days - 1


def sharePx():
    if(VaultBalances['TotalShares'] == 0):
        return 1
    return (VaultBalances["ValidatorAmount"] + (VaultBalances['claimedRewards'] + VaultBalances["rewards"]) * (1-fee)) / VaultBalances["TotalShares"]


def time_pass(days, verbose = False):
    global currentTimestamp
    currentTimestamp += days * 86400
    if(verbose):
        print(days,'days pass by...(',datetime.fromtimestamp(currentTimestamp),')')
    VaultBalances['rewards'] += VaultBalances['ValidatorAmount'] * XPY(days)
    return


def show_state():
    print('┌----------------------------------------------------------------------------┐')
    print('|ValidatorAmount =', VaultBalances["ValidatorAmount"])
    print('|VaultAmount =', VaultBalances["VaultAmount"])
    print('|Rewards =', VaultBalances["rewards"])
    print('|Claimed rewards =', VaultBalances["claimedRewards"])
    print('|Share price =',sharePx())
    print('|PreShares:',preshares)
    print('|Total shares:',VaultBalances["TotalShares"])
    print('|Shares:',shares)
    print('|Balances from shares',{k:round(v*sharePx(),2) for k, v in shares.items()})
    print('|Deposit queue total:', VaultBalances["DqueueTotal"])
    print('|Deposit queue:',[(Dqueue.Q[idx].user, Dqueue.Q[idx].amount) for idx in Dqueue.Q])
    # print(*((Dbatches.Q[idx].requests) for idx in Dbatches.Q))
    # print('|Deposit queue:', *((Dbatches.Q[idx].requests) for idx in Dbatches.Q), sep='\n                ')
    print('|Withdraw queue total:', VaultBalances["WqueueTotal"])
    print('|Withdraw queue:',[(Wqueue.Q[idx].user, Wqueue.Q[idx].amount) for idx in Wqueue.Q])
    print('└----------------------------------------------------------------------------┘')
    return


def claimRewards():
    VaultBalances['claimedRewards'] += VaultBalances['rewards']
    VaultBalances['rewards'] = 0
    return


def vaultInjection(amount):
    VaultBalances['VaultAmount'] += amount
    return


# THIS POSES A THREAT, CALLER CAN WITHDRAW EVEYRYTHING FROM THE VAULT
def vaultLeakage(amount):
    VaultBalances['VaultAmount'] -= amount
    return


def stake():
    if(VaultBalances['DqueueTotal'] <= 0):
        Dqueue.clear()
        return
    # stake everything in Dqueue, delete preshares, create shares for the users, clear Dqueue
    currentSharePx = sharePx()
    while(not Dqueue.isEmpty()):
        req = Dqueue.dequeue()
        preshares[req.user] -= req.amount
        numOfShares = req.amount / currentSharePx
        if req.user in shares:
            shares[req.user] += numOfShares
        else:
            shares[req.user] = numOfShares
        VaultBalances['TotalShares'] += numOfShares
    # mint shares from claimed rewards
    numOfShares = VaultBalances['claimedRewards'] * fee / currentSharePx
    shares['Treasury'] += numOfShares
    VaultBalances['TotalShares'] += numOfShares
    # stake contents of Dqueue by pay stake fee using VaultAmount and restake claimed rewards
    print("Staking", VaultBalances['DqueueTotal'], "MATIC")
    VaultBalances["VaultAmount"] -= stakeFee
    VaultBalances["ValidatorAmount"] += (VaultBalances['DqueueTotal'] + VaultBalances['claimedRewards'])
    VaultBalances["VaultAmount"] -= VaultBalances['DqueueTotal']
    VaultBalances['DqueueTotal'] = 0
    VaultBalances['claimedRewards'] = 0
    return


def unstake():
    # unstake everything in Wqueue and delete shares for the users, clear Wqueue
    print ("Unstaking", VaultBalances['WqueueTotal'], "MATIC")
    currentSharePx = sharePx()
    VaultBalances['VaultAmount'] -= unstakeFee
    VaultBalances['ValidatorAmount'] -= VaultBalances['WqueueTotal']
    VaultBalances['VaultAmount'] += VaultBalances['WqueueTotal']
    VaultBalances['WqueueTotal'] = 0
    while(not Wqueue.isEmpty()):
        req = Wqueue.dequeue()
        numOfShares = req.amount / currentSharePx
        shares[req.user] -= numOfShares
        VaultBalances['TotalShares'] -= numOfShares
        # Transfer amount to user
        print('Transfer', req.amount, 'MATIC to', req.user)
        VaultBalances['VaultAmount'] -= req.amount
    return


def pairQueues():
    if (Dqueue.isEmpty() or Wqueue.isEmpty()):
        return
    # tranfer amount from Dqueue.Q[Dqueue.first].user to Wqueue.Q[Wqueue.first].user
    #   ie transfer shares from Dqueue.Q[Dqueue.first].user to Wqueue.Q[Wqueue.first].user
    #   also delete preshares of Dqueue.Q[Dqueue.first].user
    #   and transfer amount from VaultAmount to Wqueue.Q[Wqueue.first].user
    amount = min(Dqueue.Q[Dqueue.first].amount, Wqueue.Q[Wqueue.first].amount)
    numOfShares = amount / sharePx()
    shares[Wqueue.Q[Wqueue.first].user] -= numOfShares
    if Dqueue.Q[Dqueue.first].user in shares:
        shares[Dqueue.Q[Dqueue.first].user] += numOfShares
    else:
        shares[Dqueue.Q[Dqueue.first].user] = numOfShares
    preshares[Dqueue.Q[Dqueue.first].user] -= amount
    print('Transfer', amount * (1 - depositFee) , 'MATIC to', Wqueue.Q[Wqueue.first].user)
    VaultBalances["VaultAmount"] -= amount * (1 - depositFee)
    VaultBalances["DqueueTotal"] -= amount
    VaultBalances["WqueueTotal"] -= amount
    if (Dqueue.Q[Dqueue.first].amount < Wqueue.Q[Wqueue.first].amount):
        Wqueue.Q[Wqueue.first].amount -= amount
        Dqueue.dequeue()
    elif (Dqueue.Q[Dqueue.first].amount > Wqueue.Q[Wqueue.first].amount):
        Dqueue.Q[Dqueue.first].amount -= amount
        Wqueue.dequeue()
    elif (Dqueue.Q[Dqueue.first].amount == Wqueue.Q[Wqueue.first].amount):
        Wqueue.dequeue()
        Dqueue.dequeue()
    pairQueues()
    return


def reduceDRequests(user, amount):
    print('Reduce deposit requests for', user, 'by', amount)
    # find user's deposit requests and reduce them by amount starting by the oldest one
    idx = Dqueue.first
    remainingAmount = amount
    while (idx <= Dqueue.last and remainingAmount > 0):
        if (Dqueue.Q[idx].user == user):
            if (Dqueue.Q[idx].amount > remainingAmount):
                Dqueue.Q[idx].amount -= remainingAmount
                remainingAmount = 0
            else:
                remainingAmount -= Dqueue.Q[idx].amount
                if(idx == Dqueue.first):
                    Dqueue.dequeue()
                else:
                    Dqueue.Q[idx].amount = 0
        idx += 1
    return 


def expiryCheck():
    if(not Dqueue.isEmpty() and Dqueue.Q[Dqueue.first].expirydate < currentTimestamp):
        print('Stake expired deposit request')
        stake()
    if(not Wqueue.isEmpty() and Wqueue.Q[Wqueue.first].expirydate < currentTimestamp):
        print('Unstake expired withdraw request')
        unstake()
    return


def deposit(user, amount):
    claimRewards()
    # Add deposit fee 0.1% of amount
    VaultBalances['VaultAmount'] += amount * (1 + depositFee)
    VaultBalances["DqueueTotal"] += amount 
    # give preshares to user
    if user in preshares:
        preshares[user] += amount
    else:
        preshares[user] = amount
    # add user's deposit request to the D queue
    newRequest = request(user, amount)
    Dqueue.enqueue(newRequest)
    # true if D queue is active or both queues are empty
    if (Wqueue.isEmpty()):
        # check if oldest request in the D queue is expired OR total amount in D queue reached threshold
        if(VaultBalances["DqueueTotal"] >= DqueueThreshold):
            stake()
        expiryCheck()
    # true if W queue is active
    else:
        # net queues and check if oldest request in the D queue is expired
        pairQueues()
        expiryCheck()
    return


def withdraw(user, amount):
    claimRewards()              
    if(amount > shares[user] * sharePx() + preshares[user]):
        print('Transaction Reverted: Insufficient Funds')
        return           
    # check if user has preshares (use all preshares before using shares for withdrawal)
    if (preshares[user]):
        # if amount == preshares    ->  transfer amount to user, clear preshares, remove deposit request(s) (set amount to 0)
        # if amount < preshares     ->  transfer amount to user, reduce number of preshares and reduce amount of deposit request(s)
        # if amount > preshares     ->  transfer amount from preshares to user, clear preshares and remove deposit request(s) , set new withdraw request
        tempAmount = min(amount, preshares[user])
        VaultBalances["VaultAmount"] -= tempAmount * (1 + depositFee)
        VaultBalances["DqueueTotal"] -= tempAmount
        if (preshares[user] >= amount):
            preshares[user] -= tempAmount
            reduceDRequests(user, tempAmount)
            return
        elif (preshares[user] < amount):
            preshares[user] -= tempAmount
            reduceDRequests(user, tempAmount)
            newRequest = request(user, amount - tempAmount)
    else:
        newRequest = request(user, amount)
    Wqueue.enqueue(newRequest)
    VaultBalances["WqueueTotal"] += newRequest.amount
    if (Dqueue.isEmpty()):
        if(VaultBalances["WqueueTotal"] >= WqueueThreshold):
            unstake()
        expiryCheck()
    else:
        pairQueues()
        expiryCheck()
    return


def directDeposit(user, amount):
    claimRewards()
    # Add stake fee as deposit fee 
    VaultBalances['VaultAmount'] += amount + stakeFee
    VaultBalances["DqueueTotal"] += amount 
    # give preshares to user
    if user in preshares:
        preshares[user] += amount
    else:
        preshares[user] = amount
    # add user's deposit request to the D queue
    newRequest = request(user, amount)
    Dqueue.enqueue(newRequest)
    # if Wqueue is not empty pair the queues
    if(not Wqueue.isEmpty()):
        pairQueues()
    # if Wqueue is empty after pairing, stake and clear Dqueue
    if (Wqueue.isEmpty()):
        stake()
    return


def directWithdraw(user, amount):
    claimRewards()       
    if(amount > shares[user] * sharePx() + preshares[user]):
        print('Transaction Reverted: Insufficient Funds')
        return 
    # check if user has preshares (use all preshares before using shares for withdrawal)
    if (preshares[user]):
        # if amount == preshares    ->  transfer amount to user, clear preshares, remove deposit request(s) (set amount to 0)
        # if amount < preshares     ->  transfer amount to user, reduce number of preshares and reduce amount of deposit request(s)
        # if amount > preshares     ->  transfer amount from preshares to user, clear preshares and remove deposit request(s) , set new withdraw request
        tempAmount = min(amount, preshares[user])
        VaultBalances["VaultAmount"] -= tempAmount + unstakeFee
        VaultBalances["DqueueTotal"] -= tempAmount
        if (preshares[user] >= amount):
            preshares[user] -= tempAmount
            reduceDRequests(user, tempAmount)
            return
        elif (preshares[user] < amount):
            preshares[user] -= tempAmount
            reduceDRequests(user, tempAmount)
            newRequest = request(user, amount - tempAmount)
    else:
        newRequest = request(user, amount)
    Wqueue.enqueue(newRequest)
    VaultBalances["WqueueTotal"] += newRequest.amount
    # if Dqueue is not empty pair the queues 
    if(not Dqueue.isEmpty()):
        pairQueues()
    # if Dqueue is empty after pairing, unstake and clear Wqueue
    if (Dqueue.isEmpty()):
        unstake()
    return


def initialisation():
    global Dqueue, Wqueue, shares, preshares, VaultBalances, currentTimestamp 
    currentTimestamp = datetime.timestamp(datetime.now())
    Dqueue = queue()
    Wqueue = queue()
    shares = {}
    preshares = {}
    VaultBalances = {"ValidatorAmount": 0, 
                     "VaultAmount": 0,
                     "rewards": 0,
                     "claimedRewards":0,
                     "TotalShares":0,
                     "DqueueTotal":0,
                     "WqueueTotal":0
                    }
    vaultInjection(1000)
    print('fee',fee)
    print('depositFee',depositFee)
    print('withdrawFee',withdrawFee)
    print('DqueueThreshold',DqueueThreshold)
    print('WqueueThreshold',WqueueThreshold)
    print('timestamp',datetime.fromtimestamp(currentTimestamp))
    shares['Treasury'] = 0
    deposit('Reserve',100)


#%% Test 1
initialisation()
for i in range(20):
    deposit('user'+str(int(i/2)), 1000)
show_state()
time_pass(10, True)
expiryCheck()
show_state()
time_pass(90, True)
show_state()
for i in range(20):
    deposit('user'+str(int(i/2)), 1000)
time_pass(10, True)
show_state()
expiryCheck()
show_state()


#%% Test 2
initialisation()
for i in range(20):
    deposit('user'+str(int(i/2)), 1000)
show_state()
time_pass(10, True)
expiryCheck()
show_state()
time_pass(90, True)
show_state()
for i in range(20):
    withdraw('user'+str(int(i/2)), 1000)
show_state()
time_pass(10, True)
expiryCheck()
show_state()


#%% Test 3
initialisation()
deposit('Alice', 1000)
time_pass(10, True)
expiryCheck()
deposit('Alice', 1000)
withdraw('Alice',1500)
time_pass(10, True)
show_state()
withdraw('Alice',501)
time_pass(10, True)
show_state()

#%% Test 4
initialisation()
deposit('Alice', 1000)
time_pass(10, True)
expiryCheck()
deposit('Bob', 1000)
withdraw('Alice',500)
show_state()




#%% Test 5
initialisation()
directDeposit('user', 10000)
show_state()
for day in range(1, 10):
    time_pass(1)
    deposit('user', 1500)
    withdraw('user', 1000)
    show_state()



# Tests

#%% 
show_state()
#%% 
initialisation()
#%% 
time_pass(1, True)
#%% 
expiryCheck()
#%% 
deposit('Alice', 1500)
#%% 
withdraw('Alice',1000)
#%% 
directDeposit('Alice', 10000)
#%% 
directWithdraw('Alice', 2002)
#%% 
deposit('Bob', 10000)
#%%
withdraw('Bob', 6000)
#%%
directDeposit('Bob', 5000)
#%%
directWithdraw('Bob', 1000)


