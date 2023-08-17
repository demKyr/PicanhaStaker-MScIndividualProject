#%%

from C_queueUsingDictionary import queue
from datetime import datetime


# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
currentTimestamp = datetime.timestamp(datetime.now())

# Adjustable constants
fee = 0.5                # Fee on rewards
depositFee = 0.001
withdrawFee = 0.001
# batchSize = 15000 
batchSize = max(stakeFee / depositFee, unstakeFee / withdrawFee)
expiryPeriod = 7 * 86400 # 7 days


class batch:
    def __init__(self):
        self.balance = 0
        self.expirydate = currentTimestamp + expiryPeriod
        self.requests = []


# Simulation parameters
Dbatches = queue()
Dbatches.enqueue(batch())
Wbatches = queue()
Wbatches.enqueue(batch())
shares = {}
preshares = {}
unshares = {}
VaultBalances = {"ValidatorAmount": 0, 
                 "VaultAmount": 0,
                 "rewards": 0,
                 "claimedRewards":0,
                 "TotalShares":0
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
    print('|UnShares:',unshares)
    print('|Total shares:',VaultBalances["TotalShares"])
    print('|Shares:',shares)
    print('|Balances from shares',{k:round(v*sharePx(),2) for k, v in shares.items()})
    # print('|Deposit queue:',Dbatches.Q[Dbatches.last].requests)
    # print('|Withdraw queue:',Wbatches.Q[Wbatches.last].requests)
    print('|Deposit queue:', *((Dbatches.Q[idx].requests) for idx in Dbatches.Q), sep='\n                ')
    print('|Withdraw queue:', *((Wbatches.Q[idx].requests) for idx in Wbatches.Q), sep='\n                ')
    print('└----------------------------------------------------------------------------┘')
    return


def claimRewards():
    VaultBalances['claimedRewards'] += VaultBalances['rewards']
    VaultBalances['rewards'] = 0
    return



def stake(Dbatch):
    currentSharePx = sharePx()
    print('Staking',Dbatch.balance,'...')
    for (user, amount) in Dbatch.requests:
        preshares[user] -= amount
        numOfShares = amount / currentSharePx
        if user in shares:
            shares[user] += numOfShares
        else:
            shares[user] = numOfShares
        VaultBalances['TotalShares'] += numOfShares
        
    # mint shares from claimed rewards
    numOfShares = VaultBalances['claimedRewards'] * fee / currentSharePx
    shares['Treasury'] += numOfShares
    VaultBalances['TotalShares'] += numOfShares
    # stake amount by pay stake fee using VaultAmount and restake claimed rewards
    VaultBalances["VaultAmount"] -= stakeFee
    VaultBalances["ValidatorAmount"] += (Dbatch.balance + VaultBalances['claimedRewards'])
    VaultBalances["VaultAmount"] -= Dbatch.balance 
    VaultBalances['claimedRewards'] = 0
    return


def unstake(Wbatch):
    currentSharePx = sharePx()
    print('Unstaking',Wbatch.balance,'...')
    # unstake amount and pay unstake fee using VaultAmount
    VaultBalances["VaultAmount"] -= unstakeFee
    VaultBalances["ValidatorAmount"] -= Wbatch.balance
    VaultBalances["VaultAmount"] += Wbatch.balance
    for (user, amount) in Wbatch.requests:
        numOfShares = amount / currentSharePx
        shares[user] -= numOfShares
        VaultBalances["VaultAmount"] -= amount
        VaultBalances['TotalShares'] -= numOfShares
        unshares[user] -= amount
        # transfer amount to user
    return


def expiryCheck():
    if (not Dbatches.isEmpty() and Dbatches.Q[Dbatches.first].expirydate < currentTimestamp):
        print('Deposit expired batch')
        while(not Dbatches.isEmpty()): # since we are calling stake, we do it for all batches, even the non-expired
            stake(Dbatches.Q[Dbatches.first])
            Dbatches.dequeue()
        expiryCheck()
    if (not Wbatches.isEmpty() and Wbatches.Q[Wbatches.first].expirydate < currentTimestamp):
        print('Withdraw expired batch')
        while(not Wbatches.isEmpty()): # since we are calling unstake, we do it for all batches, even the non-expired
            unstake(Wbatches.Q[Wbatches.first])
            Wbatches.dequeue()
        expiryCheck()


def pairBatches(Dbatch, Wbatch):
    print("Pairing batches")
    currentSharePx = sharePx()
    for (user, amount) in Wbatch.requests:
        numOfShares = amount / currentSharePx
        shares[user] -= numOfShares
        unshares[user] -= amount
        # tranfer amount to user but keep unstake fee 0.1% of amount
        VaultBalances["VaultAmount"] -= amount * (1 - withdrawFee)
    for (user, amount) in Dbatch.requests:
        preshares[user] -= amount
        numOfShares = amount / currentSharePx
        if user in shares:
            shares[user] += numOfShares
        else:
            shares[user] = numOfShares
    return


def batchComplete():
    if (Wbatches.isEmpty() or Dbatches.isEmpty()):
        return
    pairBatches(Dbatches.Q[Dbatches.first], Wbatches.Q[Wbatches.first])
    Dbatches.dequeue()
    Wbatches.dequeue()
    return


def deposit(user, amount):
    claimRewards()
    # Add deposit fee 0.1% of amount
    VaultBalances["VaultAmount"] += amount * (1 + depositFee)
    # add user's deposit request
    if(amount + Dbatches.Q[Dbatches.last].balance <= batchSize):
        # give preshares to user
        if user in preshares:
            preshares[user] += amount
        else:
            preshares[user] = amount
        Dbatches.Q[Dbatches.last].requests.append([user, amount])
        Dbatches.Q[Dbatches.last].balance += amount
    else:
        freeSpace = batchSize - Dbatches.Q[Dbatches.last].balance
        # give preshares to user
        if user in preshares:
            preshares[user] += freeSpace
        else:
            preshares[user] = freeSpace
        Dbatches.Q[Dbatches.last].requests.append([user, freeSpace])
        Dbatches.Q[Dbatches.last].balance += freeSpace
        Dbatches.enqueue(batch())
        batchComplete()
        deposit(user, amount - freeSpace)
        # Dbatches.Q[Dbatches.last].requests.append([user, amount - freeSpace])
        # Dbatches.Q[Dbatches.last].balance += amount - freeSpace

    expiryCheck()
    return


def withdraw(user, amount):
    claimRewards()
    if(preshares[user]>0):
        print(user,'you cannot withdraw while having pending deposit requests')
        return
    if user in unshares:
        if(shares[user] * sharePx() < amount + unshares[user]):
            print(user,'you cannot withdraw more than you have staked')
            return
    else:
        if(shares[user] * sharePx() < amount):
            print(user,'you cannot withdraw more than you have staked')
            return
        


    if(amount + Wbatches.Q[Wbatches.last].balance <= batchSize):
        if user in unshares:
            unshares[user] += amount
        else:
            unshares[user] = amount
        Wbatches.Q[Wbatches.last].requests.append([user, amount])
        Wbatches.Q[Wbatches.last].balance += amount
    else:
        freeSpace = batchSize - Wbatches.Q[Wbatches.last].balance
        if user in unshares:
            unshares[user] += freeSpace
        else:
            unshares[user] = freeSpace
        Wbatches.Q[Wbatches.last].requests.append([user, freeSpace])
        Wbatches.Q[Wbatches.last].balance += freeSpace
        Wbatches.enqueue(batch())
        batchComplete()
        withdraw(user, amount - freeSpace)
        # Wbatches.Q[Wbatches.last].requests.append([user, amount - freeSpace])
        # Wbatches.Q[Wbatches.last].balance += amount - freeSpace

    expiryCheck()
    return

def initialisation():
    global Dbatches, Wbatches, shares, preshares, unshares, VaultBalances, currentTimestamp 
    currentTimestamp = datetime.timestamp(datetime.now())
    Dbatches = queue()
    Dbatches.enqueue(batch())
    Wbatches = queue()
    Wbatches.enqueue(batch())
    shares = {}
    preshares = {}
    unshares = {}
    VaultBalances = {"ValidatorAmount": 0, 
                    "VaultAmount": 0,
                    "rewards": 0,
                    "claimedRewards":0,
                    "TotalShares":0
                    }
    print('fee',fee)
    print('depositFee',depositFee)
    print('withdrawFee',withdrawFee)
    print('batchSize',batchSize)
    print('timestamp',datetime.fromtimestamp(currentTimestamp))
    shares['Treasury'] = 0
  

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


#%% Test 3
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
deposit('user1', 11000)
show_state()

for i in range(20):
    withdraw('user'+str(int(i/2)), 1000)
show_state()

#%% Test 4
initialisation()
deposit('user1', 90000)
time_pass(10, True)
expiryCheck()
show_state()
deposit('user2',20000)
show_state()
withdraw('user1',20000)
withdraw('user1',30000)
deposit('user2',20000)
expiryCheck()
show_state()