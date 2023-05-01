#%%
# VaultBalances keep track of quantities that describe the state of the vault.
# TotalAmount : total amount delegated to the validator
# TotalShares : total number of shares that are outstanding
# TotalRewards : rewards that have not been restaked
VaultBalances = {"TotalAmount": 0, 
                    "TotalShares": 0,
                    "TotalRewards":0
                    }

# Dictionary of users and their number of shares
Users = {"Reserve":0, "Treasury":0} # {User number:User Shares}

# Fee to be taken by the protocol as a proportion of rewards.
Fee = 0.1 

#%%

def deposit(amount : float, User :int):
    
    # mint extra shares to give to depositor.
    ShareIncrease = amount / SharePx()
    
    # increase staked amount by deposit amount.
    VaultBalances["TotalAmount"] += amount
    # increase shares by number of new shares minted.
    VaultBalances["TotalShares"] += ShareIncrease
    
    # add new shares to user share balance.
    Users[User] = Users[User] + ShareIncrease if User in Users else ShareIncrease
    
    ShowState()

def accrue_rewards(percentage = 0.05):
    # rewards are generated but aren't staked by default.
    VaultBalances["TotalRewards"] += VaultBalances["TotalAmount"] * (percentage)
    
    ShowState()

def withdraw(amount: float, User:int):
    
    # amount to be withdrawn is converted into a number of shares to burn.
    ShareDecrease = amount / SharePx()
    
    # decrease total staked balance by withdrawal amount.
    VaultBalances["TotalAmount"] -= amount
    # burn the corresponding shares.
    VaultBalances["TotalShares"] -= ShareDecrease
    # reduce user share balance by corresponding amount.
    Users[User] -= ShareDecrease
    
    ShowState()

def SharePx():
    # share price calculation takes total amount with fee adjustment.
    if VaultBalances["TotalShares"] !=0:
        return (VaultBalances["TotalAmount"]+ (1-Fee) * VaultBalances["TotalRewards"])/VaultBalances["TotalShares"]
    
    # If total outstanding shares is zero, share price (re)sets to 1.
    else:
        return 1

def ShowDust():
    # Dust is fees that havent yet been turned into shares.  
    # It's the failure of total number of shares * share price to add up to total amount in stake + reward.
		return Fee * VaultBalances["TotalRewards"]
    #Note, this is equal to: VaultBalances["TotalAmount"] + VaultBalances["TotalRewards"] - VaultBalances["TotalShares"]*SharePx() 

def RestakeRewards():
    # This function can be called by anyone.  Caller pays the gas.
    # We will have a cron-job that checks if rewards are above a threshold and call restake ourselves if so.

    # rewards are staked.  To keep share price constant when this happens, new shares need to be minted.
    NewSharesToMint = (VaultBalances["TotalAmount"] + VaultBalances["TotalRewards"])/ SharePx() - VaultBalances["TotalShares"]

    # those new shares are given to the Treasury and added to the total number of shares outstanding.
    # when this happens, the Dust balance is zeroed by definition.
    Users["Treasury"] +=NewSharesToMint
    VaultBalances["TotalShares"] += NewSharesToMint
    # rewards are added to the staked amount.
    VaultBalances["TotalAmount"] += VaultBalances["TotalRewards"]
    # reward balance is zeroed.
    VaultBalances["TotalRewards"] = 0
    ShowState()
    
def ValueShares(shares):
    # gives value of some number of shares.
    return SharePx() * shares

def ShowUserBalances():
    # shows all user balances in MATIC.
    for u in Users: 
        print(u,": ",ValueShares(Users[u]))


def ShowState():
    print(VaultBalances)
    print(Users)
    print("Share Px :",SharePx())
    print("Dust :",ShowDust())

# ------------------Examples of use: ------------------
# %%
deposit(100,"Reserve")
#%%
deposit(50,1)
deposit(50,2)
# %%
for i in range(10):
    accrue_rewards()
# %%
ShowUserBalances()
# %%
deposit(200,1)
# %%
RestakeRewards()
# %%
deposit(100,0)
#%%
withdraw(841,1)

# %%
ShowUserBalances()
# %%
withdraw(435,2)
# %%
ShowUserBalances()
# %%
withdraw(44435,2)
# %%
