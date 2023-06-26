#%%

from C_queueUsingDictionary import queue
from datetime import datetime


# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
currentTimestamp = datetime.timestamp(datetime.now())

expiryPeriod = 7 * 86400 # 7 days

class batch:
    def __init__(self):
        self.balance = 0
        self.expirydate = currentTimestamp + expiryPeriod
        self.requests = []


class ApproachC:
    def __init__(self, fee = 0.5, depositFee = 0.001, withdrawFee = 0.001, expiryPeriodParam = 7 * 86400):
        global expiryPeriod
    
        # Adjustable constants
        self.fee = fee                # Fee on rewards
        self.depositFee = depositFee
        self.withdrawFee = withdrawFee
        # batchSize = 15000 
        self.batchSize = max(stakeFee / self.depositFee, unstakeFee / self.withdrawFee)

        # Simulation parameters
        self.Dbatches = queue()
        self.Dbatches.enqueue(batch())
        self.Wbatches = queue()
        self.Wbatches.enqueue(batch())
        self.shares = {}
        self.preshares = {}
        self.unshares = {}
        self.VaultBalances = {"ValidatorAmount": 0, 
                        "VaultAmount": 0,
                        "rewards": 0,
                        "claimedRewards":0,
                        "TotalShares":0
                        }


    def XPY (self, days):
        return (1+DPY)**days - 1


    def sharePx(self):
        if(self.VaultBalances['TotalShares'] == 0):
            return 1
        return (self.VaultBalances["ValidatorAmount"] + (self.VaultBalances['claimedRewards'] + self.VaultBalances["rewards"]) * (1-self.fee)) / self.VaultBalances["TotalShares"]


    def time_pass(self, days, verbose = False):
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
        print('|UnShares:',self.unshares)
        print('|Total shares:',self.VaultBalances["TotalShares"])
        print('|Shares:',self.shares)
        print('|Balances from shares',{k:round(v*self.sharePx(),2) for k, v in self.shares.items()})
        # print('|Deposit queue:',Dbatches.Q[Dbatches.last].requests)
        # print('|Withdraw queue:',Wbatches.Q[Wbatches.last].requests)
        print('|Deposit queue:', *((self.Dbatches.Q[idx].requests) for idx in self.Dbatches.Q), sep='\n                ')
        print('|Withdraw queue:', *((self.Wbatches.Q[idx].requests) for idx in self.Wbatches.Q), sep='\n                ')
        print('└----------------------------------------------------------------------------┘')
        return


    def claimRewards(self):
        self.VaultBalances['claimedRewards'] += self.VaultBalances['rewards']
        self.VaultBalances['rewards'] = 0
        return



    def stake(self, Dbatch):
        print('begin', self.VaultBalances["VaultAmount"])
        self.show_state()
        self.SharePx = self.sharePx()
        print('Staking',Dbatch.balance,'...')
        for (user, amount) in Dbatch.requests:
            self.preshares[user] -= amount
            numOfShares = amount / self.SharePx
            if user in self.shares:
                self.shares[user] += numOfShares
            else:
                self.shares[user] = numOfShares
            self.VaultBalances['TotalShares'] += numOfShares
            
        # mint shares from claimed rewards
        numOfShares = self.VaultBalances['claimedRewards'] * self.fee / self.SharePx
        self.shares['Treasury'] += numOfShares
        self.VaultBalances['TotalShares'] += numOfShares
        # stake amount by pay stake fee using VaultAmount and restake claimed rewards
        self.VaultBalances["VaultAmount"] -= stakeFee
        self.VaultBalances["ValidatorAmount"] += (Dbatch.balance + self.VaultBalances['claimedRewards'])
        self.VaultBalances["VaultAmount"] -= Dbatch.balance 
        self.VaultBalances['claimedRewards'] = 0
        print('end', self.VaultBalances["VaultAmount"])
        return


    def unstake(self, Wbatch):
        self.SharePx = self.sharePx()
        print('Unstaking',Wbatch.balance,'...')
        # unstake amount and pay unstake fee using VaultAmount
        self.VaultBalances["VaultAmount"] -= unstakeFee
        self.VaultBalances["ValidatorAmount"] -= Wbatch.balance
        self.VaultBalances["VaultAmount"] += Wbatch.balance
        for (user, amount) in Wbatch.requests:
            numOfShares = amount / self.SharePx
            self.shares[user] -= numOfShares
            self.VaultBalances["VaultAmount"] -= amount
            self.VaultBalances['TotalShares'] -= numOfShares
            self.unshares[user] -= amount
            # transfer amount to user
        return


    def expiryCheck(self):
        if (not self.Dbatches.isEmpty() and self.Dbatches.Q[self.Dbatches.first].expirydate < currentTimestamp):
            print('Deposit expired batch')
            while(not self.Dbatches.isEmpty()):
                self.stake(self.Dbatches.Q[self.Dbatches.first])
                self.Dbatches.dequeue()
            self.expiryCheck()
        if (not self.Wbatches.isEmpty() and self.Wbatches.Q[self.Wbatches.first].expirydate < currentTimestamp):
            print('Withdraw expired batch')
            while(not self.Wbatches.isEmpty()):
                self.unstake(self.Wbatches.Q[self.Wbatches.first])
                self.Wbatches.dequeue()
            self.expiryCheck()


    def pairBatches(self, Dbatch, Wbatch):
        print("Pairing batches")
        self.SharePx = self.sharePx()
        for (user, amount) in Wbatch.requests:
            numOfShares = amount / self.SharePx
            self.shares[user] -= numOfShares
            self.unshares[user] -= amount
            # tranfer amount to user but keep unstake fee 0.1% of amount
            self.VaultBalances["VaultAmount"] -= amount * (1 - self.withdrawFee)
        for (user, amount) in Dbatch.requests:
            self.preshares[user] -= amount
            numOfShares = amount / self.SharePx
            if user in self.shares:
                self.shares[user] += numOfShares
            else:
                self.shares[user] = numOfShares
        return


    def batchComplete(self):
        if (self.Wbatches.isEmpty() or self.Dbatches.isEmpty()):
            return
        self.pairBatches(self.Dbatches.Q[self.Dbatches.first], self.Wbatches.Q[self.Wbatches.first])
        self.Dbatches.dequeue()
        self.Wbatches.dequeue()
        return


    def deposit(self, user, amount):
        self.claimRewards()
        # Add deposit fee 0.1% of amount
        self.VaultBalances["VaultAmount"] += amount * (1 + self.depositFee)
        # add user's deposit request
        if(amount + self.Dbatches.Q[self.Dbatches.last].balance <= self.batchSize):
            # give preshares to user
            if user in self.preshares:
                self.preshares[user] += amount
            else:
                self.preshares[user] = amount
            self.Dbatches.Q[self.Dbatches.last].requests.append([user, amount])
            self.Dbatches.Q[self.Dbatches.last].balance += amount
        else:
            freeSpace = self.batchSize - self.Dbatches.Q[self.Dbatches.last].balance
            # give preshares to user
            if user in self.preshares:
                self.preshares[user] += freeSpace
            else:
                self.preshares[user] = freeSpace
            self.Dbatches.Q[self.Dbatches.last].requests.append([user, freeSpace])
            self.Dbatches.Q[self.Dbatches.last].balance += freeSpace
            self.Dbatches.enqueue(batch())
            self.batchComplete()
            self.deposit(user, amount - freeSpace)
            # self.Dbatches.Q[self.Dbatches.last].requests.append([user, amount - freeSpace])
            # self.Dbatches.Q[self.Dbatches.last].balance += amount - freeSpace
        self.expiryCheck()
        return


    def withdraw(self, user, amount):
        self.claimRewards()
        if(self.preshares[user]>0):
            print(user,'you cannot withdraw while having pending deposit requests')
            return
        if user in self.unshares:
            if(self.shares[user] * self.sharePx() < amount + self.unshares[user]):
                print(user,'you cannot withdraw more than you have staked')
                return
        else:
            if(self.shares[user] * self.sharePx() < amount):
                print(user,'you cannot withdraw more than you have staked')
                return
            


        if(amount + self.Wbatches.Q[self.Wbatches.last].balance <= self.batchSize):
            self.VaultBalances["VaultAmount"] -= amount * (1 - self.depositFee)
            if user in self.unshares:
                self.unshares[user] += amount
            else:
                self.unshares[user] = amount
            self.Wbatches.Q[self.Wbatches.last].requests.append([user, amount])
            self.Wbatches.Q[self.Wbatches.last].balance += amount
        else:
            freeSpace = self.batchSize - self.Wbatches.Q[self.Wbatches.last].balance
            self.VaultBalances["VaultAmount"] -= freeSpace * (1 - self.depositFee)
            if user in self.unshares:
                self.unshares[user] += freeSpace
            else:
                self.unshares[user] = freeSpace
            self.Wbatches.Q[self.Wbatches.last].requests.append([user, freeSpace])
            self.Wbatches.Q[self.Wbatches.last].balance += freeSpace
            self.Wbatches.enqueue(batch())
            self.batchComplete()
            self.withdraw(user, amount - freeSpace)
            # self.Wbatches.Q[self.Wbatches.last].requests.append([user, amount - freeSpace])
            # self.Wbatches.Q[self.Wbatches.last].balance += amount - freeSpace
        self.expiryCheck()
        return

    def initialisation(self):
        global currentTimestamp
        currentTimestamp = datetime.timestamp(datetime.now())
        self.Dbatches = queue()
        self.Dbatches.enqueue(batch())
        self.Wbatches = queue()
        self.Wbatches.enqueue(batch())
        self.shares = {}
        self.preshares = {}
        self.unshares = {}
        self.VaultBalances = {"ValidatorAmount": 0, 
                        "VaultAmount": 0,
                        "rewards": 0,
                        "claimedRewards":0,
                        "TotalShares":0
                        }
        print('fee',self.fee)
        print('depositFee',self.depositFee)
        print('withdrawFee',self.withdrawFee)
        print('batchSize',self.batchSize)
        print('timestamp',datetime.fromtimestamp(currentTimestamp))
        self.shares['Treasury'] = 0
    