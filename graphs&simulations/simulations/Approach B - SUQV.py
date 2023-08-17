#%%
# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC

# Adjustable constants
S = 30000           # Stake threshold
U = 10000           # Unstake threshold
Q_init = U          # Queueing vault
V_init = S          # Validator vault
fee = 0.5           # Fee on rewards

# Simulation parameters
mid = (S + U) / 2
users = {}
VaultBalances = {"Q": Q_init, 
                 "V": V_init,
                 "rewards": 0,
                 "claimedRewards":0,
                 "TotalShares":0
                }

# Simulation functions
def XPY (days):
    return (1+DPY)**days - 1

def sharePx():
    if(VaultBalances['TotalShares'] == 0):
        return 1
    return (VaultBalances['V'] + VaultBalances['Q'] + VaultBalances['claimedRewards'] + VaultBalances['rewards'] * (1-fee) ) / VaultBalances['TotalShares']

def show_state():
    print('V =', VaultBalances['V'])
    print('Q =', VaultBalances['Q'])
    print('Rewards =', VaultBalances['rewards'])
    print('Claimed rewards =', VaultBalances['claimedRewards'])
    print('Share price =',sharePx())
    print('Total number of shares = ', VaultBalances['TotalShares'])
    print('Shares:',users)
    print('Balances',{k:v*sharePx() for k, v in users.items()})
    return

# Stake: Transfer amount from Q to V
def stakeAndRestake(amount):
    print('Staking',amount,'...')
    VaultBalances['V'] += amount
    VaultBalances['Q'] -= amount
    return

# Unstake: Transfer amount from V to Q
def unstake(amount):
    print('Unstaking',amount,'...')
    VaultBalances['V'] -= amount
    VaultBalances['Q'] += amount
    return

def deposit(name, amount):
    # Increase user's shares
    numOfShares = amount / sharePx()
    if name in users:
        users[name] += numOfShares
    else:
        users[name] = numOfShares
    VaultBalances['TotalShares'] += numOfShares
    VaultBalances['Q'] += amount
    # mint shares from fees
    numOfShares = VaultBalances['rewards'] * fee / sharePx()
    users['Treasury'] += numOfShares
    VaultBalances['TotalShares'] += numOfShares
    # add claimed rewards to stake amount and claim the rewards
    VaultBalances['Q'] += VaultBalances['claimedRewards']
    VaultBalances['claimedRewards'] = VaultBalances['rewards']
    VaultBalances['rewards'] = 0
    # Update Q and stake&restake if necessary
    if(VaultBalances['Q'] >= S):
         stakeAndRestake(VaultBalances['Q'] - mid)
    return

def withdraw(name, amount):
    # Decrease user's shares
    numOfShares = amount / sharePx()
    users[name] -= numOfShares
    VaultBalances['TotalShares'] -= numOfShares
    # mint shares from fees
    numOfShares = VaultBalances['rewards'] * fee / sharePx()
    users['Treasury'] += numOfShares
    VaultBalances['TotalShares'] += numOfShares
    # sub claimed rewards from unstake amount and claim the rewards
    unstakeAmount = amount - VaultBalances['claimedRewards']
    VaultBalances['claimedRewards'] = VaultBalances['rewards']
    VaultBalances['rewards'] = 0
    # update Q and unstake if necessary
    if (VaultBalances['Q'] - unstakeAmount < U):
        unstake(mid - VaultBalances['Q'] + unstakeAmount)
        # Note: this will take 80 epochs (2-3 days)
        VaultBalances['Q'] -= unstakeAmount
    else:
        VaultBalances['Q'] -= unstakeAmount
    return

def time_pass(days):
    VaultBalances['rewards'] += VaultBalances['V'] * XPY(days)
    return

def initialisation():
    numOfShares = (VaultBalances['V'] + VaultBalances['Q']) / sharePx()
    users['Treasury'] = numOfShares
    VaultBalances['TotalShares'] = numOfShares
    return

initialisation()
show_state()

#%%
deposit('Alice',20000)
show_state()

#%%
deposit('Bob',10000)
show_state()

#%%
deposit('Jack',10000)
show_state()

#%%
withdraw('Alice',10000)
show_state()

#%%
withdraw('Bob',10000)
show_state()

#%%
withdraw('Jack',10000)
show_state()

#%%
time_pass(30)
show_state()
