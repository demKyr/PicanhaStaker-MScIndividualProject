#%% 
VaultBalances = {"TotalAmount": 0,  
                     "TotalShares": 0, 
                     "TotalRewards":0, 
                     #"SharePx":1\ 
                     } 
  
Users = {"Reserve":0, "Treasury":0} # {User number:User Shares} 
  
Fee = 0.1 # fee to be taken as a proportion of rewards. 
  
  
#%% 
  
  
def deposit(amount : float, User :int): 
      
     ShareIncrease = amount / SharePx() #VaultBalances["SharePx"] 
      
     VaultBalances["TotalAmount"] += amount 
     VaultBalances["TotalShares"] += ShareIncrease 
      
     Users[User] = Users[User] + ShareIncrease if User in Users else ShareIncrease 
      
     ShowState() 
  
def accrue_rewards(percentage = 0.05): 
    VaultBalances["TotalRewards"] += VaultBalances["TotalAmount"] * (percentage) 
    #VaultBalances["SharePx"] = (VaultBalances["TotalAmount"]+ (1-Fee) * VaultBalances["TotalRewards"])/VaultBalances["TotalShares"] 
    ShowState() 
 
def withdraw(amount: float, User:int): 
     
    ShareDecrease = amount / SharePx() #VaultBalances["SharePx"] 
     
    VaultBalances["TotalAmount"] -= amount 
    VaultBalances["TotalShares"] -= ShareDecrease 
     
    Users[User] -= ShareDecrease 
     
    ShowState() 
 
def RestakeRewards(): 
 
    NewSharesToMint = (VaultBalances["TotalAmount"] + VaultBalances["TotalRewards"])/ SharePx() - VaultBalances["TotalShares"] 
    # d_NewSharesToMint =  VaultBalances["TotalRewards"] / SharePx() # MY LINE
    # print('NewSharesToMint',NewSharesToMint)     # MY LINE
    # print('d_NewSharesToMint',d_NewSharesToMint)   # MY LINE
 
    Users["Treasury"] += NewSharesToMint 
    VaultBalances["TotalShares"] += NewSharesToMint 
    VaultBalances["TotalAmount"] += VaultBalances["TotalRewards"] 
    VaultBalances["TotalRewards"] = 0 
    ShowState() 
 
def SharePx(): 
    # share price calculation takes total amount with fee adjustment.   
    if VaultBalances["TotalShares"] !=0: 
        return (VaultBalances["TotalAmount"] + (1-Fee) * VaultBalances["TotalRewards"])/VaultBalances["TotalShares"] 
     
    # If total outstanding shares is zero, share price (re)sets to 1. 
    else: 
        return 1 
     
 
def ValueShares(shares): 
    return SharePx() * shares # VaultBalances["SharePx"]*shares 
 
def ShowUserBalances(): 
    for u in Users:  
        print(u,": ",ValueShares(Users[u])) 
 
def ShowDust(): 
    return VaultBalances["TotalAmount"] + VaultBalances["TotalRewards"] - VaultBalances["TotalShares"]*SharePx() 
 
def ShowState(): 
    print(VaultBalances) 
    print(Users) 
    print("Share Px :",SharePx()) 
    print("Dust :",ShowDust()) 
    print("d_Dust :", Fee * VaultBalances["TotalRewards"])   # MY LINE
 
# %% 
deposit(100,"Reserve") 
#%% 
deposit(400,1) 
deposit(300,2) 
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
# %% 
ShowState() 

# %%