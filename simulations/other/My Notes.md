# Questions
<!-- How did the share price change -->
<!-- How does the code ensure that 3 days have past (_unbond function) -->

<!-- No fee in .sol -->
<!-- Reserve & Treasury -->
<!-- Shares from rewards shouldn't be shared to the users? -->

<!-- Check for balance before withdrawal  -->
<!-- don't see Reserve account to be affected -->
<!-- line 66: return fee * VaultBalances["TotalRewards"] -->


# Issues
<!-- Couldn't test withdraw ("Incomplete withdrawal period") -->
<!-- Couldn't return unbondNonce in test_withdrawRequest -->

# Links
https://trufin.io/
https://goerlifaucet.com/
https://faucet.polygon.technology/
https://web3py.readthedocs.io/en/v5/examples.html#interacting-with-existing-contracts
https://web3py.readthedocs.io/en/v5/contracts.html
https://web3py.readthedocs.io/en/stable/web3.eth.html
https://goerli.etherscan.io/address/0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae
https://www.notion.so/trufin/Fiorentina-Financial-Architecture-0d27ee36fe1d4cafbf649b82608918ca
https://goerli.etherscan.io/address/0x507153Ec325AFEb5CfC9ecF0f93BFd748639783A


# ######################################################################### #

# Dust
TotalAmount + TotalRewards - TotalShares * ( (TotalAmount + (1-Fee) * TotalRewards) / TotalShares )
TotalAmount + TotalRewards - TotalShares * ( (TotalAmount + TotalRewards - Fee * TotalRewards ) / TotalShares )
TotalAmount + TotalRewards - TotalAmount - TotalRewards + Fee * TotalRewards
=> Dust = Fee * TotalRewards

# SharePx
(TotalAmount + (1-Fee) * TotalRewards) / TotalShares
(TotalAmount + TotalRewards - Fee * TotalRewards )  /   TotalShares
TotalAmount / TotalShares   +   TotalRewards / TotalShares    -   Fee * TotalRewards / TotalShares 
=> SharePx = TotalAmount / TotalShares   +   TotalRewards / TotalShares   -   Fee * TotalRewards / TotalShares 

# NewSharesToMint 
(TotalAmount + TotalRewards) / SharePx() - TotalShares
(TotalAmount + TotalRewards) * TotalShares / (TotalAmount + (1-Fee) * TotalRewards)    -    TotalShares
(TotalAmount + TotalRewards) * TotalShares / (TotalAmount + TotalRewards - Fee * TotalRewards)    -    TotalShares
(TotalAmount * TotalShares + TotalRewards * TotalShares)  / (TotalAmount + TotalRewards - Fee * TotalRewards)    -    TotalShares 
=> NewSharesToMint = (TotalAmount * TotalShares + TotalRewards * TotalShares)  / (TotalAmount + TotalRewards - Fee * TotalRewards)     -    TotalShares




# Show that TotalAmount / SharePx() != TotalShares
TotalAmount / SharePx()
TotalAmount * TotalShares / (TotalAmount + TotalRewards - Fee * TotalRewards) 
note that: TotalRewards - Fee * TotalRewards >= 0
if: TotalRewards - Fee * TotalRewards > 0
then: TotalAmount / SharePx() < TotalShares
in general: TotalAmount / SharePx() <= TotalShares
###### wrong: d_NewSharesToMint =  TotalRewards / SharePx() 