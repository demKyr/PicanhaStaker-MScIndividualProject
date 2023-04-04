#%%
# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC

# Adjustable constants
S = 30000                   # Stake threshold
U = 1500                    # Unstake threshold
fee = 0.5                   # Fee on rewards
# fee = (S+U) / (4*S+2*U)   # Fee on rewards
Q_init = U                  # Queueing vault
V_init = S                  # Validator vault

# Simulation parameters
# mid = (S + U) / 2
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
    print('----------------------------------------------------------------------------')
    print('V =', VaultBalances['V'])
    print('Q =', VaultBalances['Q'])
    print('Rewards =', VaultBalances['rewards'])
    print('Claimed rewards =', VaultBalances['claimedRewards'])
    print('Share price =',sharePx())
    print('Total number of shares = ', VaultBalances['TotalShares'])
    print('Shares:',users)
    print('Balances',{k:v*sharePx() for k, v in users.items()})
    print('----------------------------------------------------------------------------')
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

def deposit(name, amount, verbose=False):
    if(verbose):
        print(name, 'deposits', amount)
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
         stakeAndRestake(VaultBalances['Q'] - U)
    return

def withdraw(name, amount, verbose=False):
    if(verbose):
        print(name, 'withdraws', amount)
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
    if (VaultBalances['Q'] - unstakeAmount < 0):
        unstake(U - VaultBalances['Q'] + unstakeAmount)
        # Note: this will take 80 epochs (2-3 days)
        VaultBalances['Q'] -= unstakeAmount
    else:
        VaultBalances['Q'] -= unstakeAmount
    return

def withdrawAll(name, verbose = False):
    if(verbose):
        print(name, 'withdraws all', users[name] * sharePx())
    withdraw(name, users[name] * sharePx())
    return

def time_pass(days, verbose = False):
    if(verbose):
        print(days,'days pass by...')
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
withdraw('Alice',20000)
show_state()

#%%
withdraw('Bob',10000)
show_state()

#%%
withdraw('Jack',10000)
show_state()

#%%
time_pass(365)
show_state()


#%% Senario 1
time_pass(30, True)
deposit('Alice',200, True)
time_pass(30, True)
deposit('Bob',1000, True)
deposit('Alice',200, True)
time_pass(30, True)
deposit('Jack',100, True)
time_pass(30, True)
time_pass(30, True)
deposit('Alice',200, True)
time_pass(30, True)
deposit('Bob',1000, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
show_state()
withdrawAll('Alice', True)
time_pass(30, True)
withdrawAll('Bob', True)
time_pass(30, True)
withdrawAll('Jack', True)
time_pass(30, True)
show_state()


#%% Senario 2
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
deposit('Alice',30000, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
time_pass(30, True)
withdrawAll('Alice', True)
show_state()



