#%%

from D_queueUsingDictionary import queue
from datetime import datetime

# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
currentTimestamp = datetime.timestamp(datetime.now())

expiryPeriod = 7 * 86400 # Expiry period for requests

class request:
    def __init__(self, user, amount, isDirectWithdraw = False):
        self.user = user
        self.amount = amount
        self.expirydate = currentTimestamp + expiryPeriod
        self.isDirectWithdraw = isDirectWithdraw


class ApproachD:

    def __init__(self, fee = 0.1, depositFee = 0.001, withdrawFee = 0.001, expiryPeriodParam = 7 * 86400):
        global expiryPeriod
        # Adjustable constants
        self.fee = fee # Fee on rewards
        self.depositFee = depositFee # Fee on deposits
        self.withdrawFee = withdrawFee # Fee on withdrawals
        self.DqueueThreshold = stakeFee / self.depositFee # Threshold for Dqueue
        self.WqueueThreshold = unstakeFee / self.withdrawFee # Threshold for Wqueue
        expiryPeriod = expiryPeriodParam # Expiry period for requests

        # Simulation parameters
        self.Dqueue = queue()
        self.Wqueue = queue()
        self.shares = {}
        self.preshares = {}
        self.VaultBalances = {"ValidatorAmount": 0, 
                        "VaultAmount": 0,
                        "rewards": 0,
                        "claimedRewards":0,
                        "TotalShares":0,
                        "DqueueTotal":0,
                        "WqueueTotal":0
                        }





    def XPY (self, days):
        return (1+DPY)**days - 1


    def sharePx(self):
        if(self.VaultBalances['TotalShares'] == 0):
            return 1
        return (self.VaultBalances["ValidatorAmount"] + (self.VaultBalances['claimedRewards'] + self.VaultBalances["rewards"]) * (1-self.fee)) / self.VaultBalances["TotalShares"]


    def time_pass(self,days, verbose = False):
        global currentTimestamp
        currentTimestamp += days * 86400
        if(verbose):
            print(days,'days pass by...(',datetime.fromtimestamp(currentTimestamp),')')
        self.VaultBalances['rewards'] += self.VaultBalances['ValidatorAmount'] * self.XPY(days)
        return


    def show_state(self):
        print('┌----------------------------------------------------------------------------┐')
        print('|ValidatorAmount =', self.VaultBalances["ValidatorAmount"])
        print('|VaultAmount =', self.VaultBalances["VaultAmount"])
        print('|Rewards =', self.VaultBalances["rewards"])
        print('|Claimed rewards =', self.VaultBalances["claimedRewards"])
        print('|Share price =',self.sharePx())
        print('|PreShares:',self.preshares)
        print('|Total shares:',self.VaultBalances["TotalShares"])
        print('|Shares:',self.shares)
        print('|Balances from shares',{k:round(v*self.sharePx(),2) for k, v in self.shares.items()})
        print('|Deposit queue total:', self.VaultBalances["DqueueTotal"])
        print('|Deposit queue:',[(self.Dqueue.Q[idx].user, self.Dqueue.Q[idx].amount) for idx in self.Dqueue.Q])
        # print(*((Dbatches.Q[idx].requests) for idx in Dbatches.Q))
        # print('|Deposit queue:', *((Dbatches.Q[idx].requests) for idx in Dbatches.Q), sep='\n                ')
        print('|Withdraw queue total:', self.VaultBalances["WqueueTotal"])
        print('|Withdraw queue:',[(self.Wqueue.Q[idx].user, self.Wqueue.Q[idx].amount) for idx in self.Wqueue.Q])
        print('└----------------------------------------------------------------------------┘')
        return


    def claimRewards(self):
        self.VaultBalances['claimedRewards'] += self.VaultBalances['rewards']
        self.VaultBalances['rewards'] = 0
        return


    def vaultInjection(self, amount):
        self.VaultBalances['VaultAmount'] += amount
        return


    # THIS POSES A THREAT, CALLER CAN WITHDRAW EVEYRYTHING FROM THE VAULT
    def vaultLeakage(self, amount):
        self.VaultBalances['VaultAmount'] -= amount
        return


    def stake(self):
        if(self.VaultBalances['DqueueTotal'] <= 0):
            self.Dqueue.clear()
            return
        # stake everything in Dqueue, delete preshares, create shares for the users, clear Dqueue
        currentSharePx = self.sharePx()
        while(not self.Dqueue.isEmpty()):
            req = self.Dqueue.dequeue()
            self.preshares[req.user] -= req.amount
            numOfShares = req.amount / currentSharePx
            if req.user in self.shares:
                self.shares[req.user] += numOfShares
            else:
                self.shares[req.user] = numOfShares
            self.VaultBalances['TotalShares'] += numOfShares
        # mint shares from claimed rewards
        numOfShares = self.VaultBalances['claimedRewards'] * self.fee / currentSharePx
        self.shares['Treasury'] += numOfShares
        self.VaultBalances['TotalShares'] += numOfShares
        # stake contents of Dqueue by pay stake fee using VaultAmount and restake claimed rewards
        print("Staking", self.VaultBalances['DqueueTotal'], "MATIC")
        self.VaultBalances["VaultAmount"] -= stakeFee
        self.VaultBalances["ValidatorAmount"] += (self.VaultBalances['DqueueTotal'] + self.VaultBalances['claimedRewards'])
        self.VaultBalances["VaultAmount"] -= self.VaultBalances['DqueueTotal']
        self.VaultBalances['DqueueTotal'] = 0
        self.VaultBalances['claimedRewards'] = 0
        return


    def unstake(self):
        # unstake everything in Wqueue and delete shares for the users, clear Wqueue
        print ("Unstaking", self.VaultBalances['WqueueTotal'], "MATIC")
        currentSharePx = self.sharePx()
        self.VaultBalances['VaultAmount'] -= unstakeFee
        self.VaultBalances['ValidatorAmount'] -= self.VaultBalances['WqueueTotal']
        self.VaultBalances['VaultAmount'] += self.VaultBalances['WqueueTotal']
        self.VaultBalances['WqueueTotal'] = 0
        while(not self.Wqueue.isEmpty()):
            req = self.Wqueue.dequeue()
            numOfShares = req.amount / currentSharePx
            self.shares[req.user] -= numOfShares
            self.VaultBalances['TotalShares'] -= numOfShares
            # Transfer amount to user
            if(req.isDirectWithdraw):
                print('Transfer', req.amount, 'MATIC to', req.user)
                self.VaultBalances['VaultAmount'] -= req.amount
            else:
                print('Transfer', req.amount * (1 - self.withdrawFee), 'MATIC to', req.user)
                self.VaultBalances['VaultAmount'] -= req.amount * (1-self.withdrawFee)
        return


    def pairQueues(self):
        if (self.Dqueue.isEmpty() or self.Wqueue.isEmpty()):
            return
        # tranfer amount from Dqueue.Q[Dqueue.first].user to Wqueue.Q[Wqueue.first].user
        #   ie transfer shares from Dqueue.Q[Dqueue.first].user to Wqueue.Q[Wqueue.first].user
        #   also delete preshares of Dqueue.Q[Dqueue.first].user
        #   and transfer amount from VaultAmount to Wqueue.Q[Wqueue.first].user
        amount = min(self.Dqueue.Q[self.Dqueue.first].amount, self.Wqueue.Q[self.Wqueue.first].amount)
        numOfShares = amount / self.sharePx()
        self.shares[self.Wqueue.Q[self.Wqueue.first].user] -= numOfShares
        if self.Dqueue.Q[self.Dqueue.first].user in self.shares:
            self.shares[self.Dqueue.Q[self.Dqueue.first].user] += numOfShares
        else:
            self.shares[self.Dqueue.Q[self.Dqueue.first].user] = numOfShares
        self.preshares[self.Dqueue.Q[self.Dqueue.first].user] -= amount
        print('Transfer', amount * (1 - self.depositFee) , 'MATIC to', self.Wqueue.Q[self.Wqueue.first].user)

        if(self.Wqueue.Q[self.Wqueue.first].isDirectWithdraw):
            print('Transfer', amount, 'MATIC to', self.Wqueue.Q[self.Wqueue.first].user)
            self.VaultBalances["VaultAmount"] -= amount
        else:
            print('Transfer', amount * (1 - self.withdrawFee) , 'MATIC to', self.Wqueue.Q[self.Wqueue.first].user)
            self.VaultBalances["VaultAmount"] -= amount * (1 - self.depositFee)

        self.VaultBalances["DqueueTotal"] -= amount
        self.VaultBalances["WqueueTotal"] -= amount
        if (self.Dqueue.Q[self.Dqueue.first].amount < self.Wqueue.Q[self.Wqueue.first].amount):
            self.Wqueue.Q[self.Wqueue.first].amount -= amount
            self.Dqueue.dequeue()
        elif (self.Dqueue.Q[self.Dqueue.first].amount > self.Wqueue.Q[self.Wqueue.first].amount):
            self.Dqueue.Q[self.Dqueue.first].amount -= amount
            self.Wqueue.dequeue()
        elif (self.Dqueue.Q[self.Dqueue.first].amount == self.Wqueue.Q[self.Wqueue.first].amount):
            self.Wqueue.dequeue()
            self.Dqueue.dequeue()
        self.pairQueues()
        return


    def reduceDRequests(self, user, amount):
        print('Reduce deposit requests for', user, 'by', amount)
        # find user's deposit requests and reduce them by amount starting by the oldest one
        idx = self.Dqueue.first
        remainingAmount = amount
        while (idx <= self.Dqueue.last and remainingAmount > 0):
            if (self.Dqueue.Q[idx].user == user):
                if (self.Dqueue.Q[idx].amount > remainingAmount):
                    self.Dqueue.Q[idx].amount -= remainingAmount
                    remainingAmount = 0
                else:
                    remainingAmount -= self.Dqueue.Q[idx].amount
                    if(idx == self.Dqueue.first):
                        self.Dqueue.dequeue()
                    else:
                        self.Dqueue.Q[idx].amount = 0
            idx += 1

        return 


    def expiryCheck(self):
        if(not self.Dqueue.isEmpty() and self.Dqueue.Q[self.Dqueue.first].expirydate < currentTimestamp):
            print('Stake expired deposit request')
            self.stake()
        if(not self.Wqueue.isEmpty() and self.Wqueue.Q[self.Wqueue.first].expirydate < currentTimestamp):
            print('Unstake expired withdraw request')
            self.unstake()
        return


    def deposit(self, user, amount):
        self.claimRewards()
        # Add deposit fee 0.1% of amount
        self.VaultBalances['VaultAmount'] += amount * (1 + self.depositFee)
        self.VaultBalances["DqueueTotal"] += amount 
        # give preshares to user
        if user in self.preshares:
            self.preshares[user] += amount
        else:
            self.preshares[user] = amount
        # add user's deposit request to the D queue
        newRequest = request(user, amount)
        self.Dqueue.enqueue(newRequest)
        # true if D queue is active or both queues are empty
        if (self.Wqueue.isEmpty()):
            # check if oldest self. in the D queue is expired OR total amount in D queue reached threshold
            if(self.VaultBalances["DqueueTotal"] >= self.DqueueThreshold):
                self.stake()
            self.expiryCheck()
        # true if W queue is active
        else:
            # net queues and check if oldest self. in the D queue is expired
            self.pairQueues()
            self.expiryCheck()
        return


    def withdraw(self, user, amount):
        self.claimRewards()              
        if(amount > self.shares[user] * self.sharePx() + self.preshares[user]):
            print('Transaction Reverted: Insufficient Funds')
            return           
        # check if user has preshares (use all preshares before using shares for withdrawal)
        if (self.preshares[user]):
            # if amount == preshares    ->  transfer amount * (1-withdrawFee) to user, clear preshares, remove deposit request(s) (set amount to 0)
            # if amount < preshares     ->  transfer amount * (1-withdrawFee) to user, reduce number of preshares and reduce amount of deposit request(s)
            # if amount > preshares     ->  transfer amount * (1-withdrawFee) from preshares to user, clear preshares and remove deposit request(s) , set new withdraw request
            tempAmount = min(amount, self.preshares[user])
            self.VaultBalances["VaultAmount"] -= tempAmount * (1 - self.depositFee)
            self.VaultBalances["DqueueTotal"] -= tempAmount
            if (self.preshares[user] >= amount):
                self.preshares[user] -= tempAmount
                self.reduceDRequests(user, tempAmount)
                return
            elif (self.preshares[user] < amount):
                self.preshares[user] -= tempAmount
                self.reduceDRequests(user, tempAmount)
                newRequest = request(user, amount - tempAmount)
        else:
            newRequest = request(user, amount)
        self.Wqueue.enqueue(newRequest)
        self.VaultBalances["WqueueTotal"] += newRequest.amount
        if (self.Dqueue.isEmpty()):
            if(self.VaultBalances["WqueueTotal"] >= self.WqueueThreshold):
                self.unstake()
            self.expiryCheck()
        else:
            self.pairQueues()
            self.expiryCheck()
        return


    def directDeposit(self, user, amount):
        self.claimRewards()
        # Add stake fee as deposit fee 
        self.VaultBalances['VaultAmount'] += amount + stakeFee
        self.VaultBalances["DqueueTotal"] += amount 
        # give preshares to user
        if user in self.preshares:
            self.preshares[user] += amount
        else:
            self.preshares[user] = amount
        # add user's deposit request to the D queue
        newRequest = request(user, amount)
        self.Dqueue.enqueue(newRequest)
        # if Wqueue is not empty pair the queues
        if(not self.Wqueue.isEmpty()):
            self.pairQueues()
        # if Wqueue is empty after pairing, stake and clear Dqueue
        if (self.Wqueue.isEmpty()):
            self.stake()
        return


    def directWithdraw(self, user, amount):
        self.claimRewards()       
        if(amount > self.shares[user] * self.sharePx() + self.preshares[user]):
            print('Transaction Reverted: Insufficient Funds')
            return 
        # user pays the unstake fee
        self.VaultBalances["VaultAmount"] += unstakeFee
        # check if user has preshares (use all preshares before using shares for withdrawal)
        if (self.preshares[user]):
            # if amount == preshares    ->  transfer amount to user, clear preshares, remove deposit request(s) (set amount to 0)
            # if amount < preshares     ->  transfer amount to user, reduce number of preshares and reduce amount of deposit request(s)
            # if amount > preshares     ->  transfer amount from preshares to user, clear preshares and remove deposit request(s) , set new withdraw request
            tempAmount = min(amount, self.preshares[user])
            self.VaultBalances["VaultAmount"] -= tempAmount
            self.VaultBalances["DqueueTotal"] -= tempAmount
            if (self.preshares[user] >= amount):
                self.preshares[user] -= tempAmount
                self.reduceDRequests(user, tempAmount)
                return
            elif (self.preshares[user] < amount):
                self.preshares[user] -= tempAmount
                self.reduceDRequests(user, tempAmount)
                newRequest = request(user, amount - tempAmount, isDirectWithdraw=True)
        else:
            newRequest = request(user, amount, isDirectWithdraw=True)
        self.Wqueue.enqueue(newRequest)
        self.VaultBalances["WqueueTotal"] += newRequest.amount
        # if Dqueue is not empty pair the queues 
        if(not self.Dqueue.isEmpty()):
            self.pairQueues()
        # if Dqueue is empty after pairing, unstake and clear Wqueue
        if (self.Dqueue.isEmpty()):
            self.unstake()
        return


    def initialisation(self, initialVaultInjection = 1000):
        currentTimestamp = datetime.timestamp(datetime.now())
        self.Dqueue = queue()
        self.Wqueue = queue()
        self.shares = {}
        self.preshares = {}
        self.VaultBalances = {"ValidatorAmount": 0, 
                        "VaultAmount": 0,
                        "rewards": 0,
                        "claimedRewards":0,
                        "TotalShares":0,
                        "DqueueTotal":0,
                        "WqueueTotal":0
                        }
        self.vaultInjection(initialVaultInjection)
        print('fee',self.fee)
        print('depositFee',self.depositFee)
        print('withdrawFee',self.withdrawFee)
        print('DqueueThreshold',self.DqueueThreshold)
        print('WqueueThreshold',self.WqueueThreshold)
        print('timestamp',datetime.fromtimestamp(currentTimestamp))
        self.shares['Treasury'] = 0
        self.deposit('Reserve',100)
