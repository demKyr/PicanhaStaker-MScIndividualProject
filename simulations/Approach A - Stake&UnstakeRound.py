import numpy as np
import matplotlib.pyplot as plt

# function to calculate the percentage yield over a period of N days
def XPY (DPY, days):
    return (1+DPY)**days - 1

# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC

# Adjustable constants
# taskAmount = 1 # MATIC
ownerFeePerc = 0.1 # 10%
userStakeFeePerc = XPY(DPY, 30) 
userUnstakeFeePerc = XPY(DPY, 30)

# Simulation parameters
NumberofMonths = 12
# Single user simulation
userInitialDeposit = 100 # MATIC
# Owner simulation
newMonthlyDeposits = 8600 # MATIC
newMonthlyWithdrawals = 0 # MATIC
totalDeposits = 0 # MATIC


# Calculate the max Stake & Unstake Funds (SUFmax) needed to cover the fees of staking and unstaking every month
SUFmax = (stakeFee + unstakeFee) / XPY(DPY, 27) # MATIC
print("SUFmax =", SUFmax, "MATIC")



# Profit from staking SUFmax funds for a N months without restaking
print('Profit from staking SUFmax funds for a N months without restaking')
compoundedSUFmaxBalance = [SUFmax]
compoundedSUFmaxProfit = [0]
for i in range(1, NumberofMonths + 1):
    compoundedSUFmaxBalance.append(compoundedSUFmaxBalance[i-1] + SUFmax * XPY(DPY, 30))        # if we don't restake every month
    # compoundedSUFmaxBalance.append(compoundedSUFmaxBalance[i-1] * (1 + XPY(DPY, 30)))         # if we restake every month
    compoundedSUFmaxProfit.append(compoundedSUFmaxProfit[i-1] + compoundedSUFmaxBalance[i] -  compoundedSUFmaxBalance[i-1])
    # print('Month', i, ':', compoundedSUFmaxBalance[i])
    # print('Month', i, ':', compoundedSUFmaxProfit[i])
# plt.figure('Profit from staking SUFmax funds for a N months without restaking')
# plt.plot(compoundedSUFmaxBalance)
# plt.plot(compoundedSUFmaxProfit)
# plt.axhline(y = 0, color = 'r', linestyle = '--')
# plt.show()




# # Per User Profit
# print('Profit for a user with initial deposit', userInitialDeposit, 'MATIC')
# userBalance = [userInitialDeposit]
# userProfit = [-userInitialDeposit * userStakeFee]
# for i in range(1, NumberofMonths + 1):
#     userBalance.append(userBalance[i-1] * XPY(DPY, 30) * (1-ownerFeePerc) + userBalance[i-1])
#     userProfit.append(userProfit[i-1] + userBalance[i] - userBalance[i-1])
#     print('Month', i, ':', userBalance[i])
#     print('Month', i, ':', userProfit[i])
# plt.figure('Profit for a user with initial deposit ' + str(userInitialDeposit) + ' MATIC')
# plt.plot(userBalance)
# plt.plot(userProfit)
# plt.axhline(y = 0, color = 'r', linestyle = '--')
# plt.show()



# Profit from using SUFmax as Stake & Unstake Funds and restaking every month for N months
ownerProfits_from_deposits = [0]
losses_from_unstaking_fee = [unstakeFee]
losses_from_staking_fee = [stakeFee]
totalOwnerProfits = [0]
for i in range(1, NumberofMonths + 1):
    print('Month', i, ':')
    # Profit from deposited funds
    rewards_from_deposits = totalDeposits * XPY(DPY, 30)
    ownerProfits_from_deposits.append(ownerProfits_from_deposits[i-1] + rewards_from_deposits * ownerFeePerc)
    print('Total deposit:', round(totalDeposits,2), 'MATIC')

    # Profit from the staked SUFmax every month
    rewards_from_SUFmax = SUFmax * XPY(DPY, 30)

    # Loss from unstaking fee 
    losses_from_unstaking_fee.append(unstakeFee - newMonthlyWithdrawals * userUnstakeFeePerc) # if losses_from_unstaking_fee[i] < 0 we take the profit

    # Loss from staking fee 
    losses_from_staking_fee.append(stakeFee - newMonthlyDeposits * userStakeFeePerc) # if losses_from_staking_fee[i] < 0 we take the profit

    # Total profit
    monthly_total_profit = ownerProfits_from_deposits[i] + rewards_from_SUFmax - losses_from_unstaking_fee[i] - losses_from_staking_fee[i]
    totalOwnerProfits.append(totalOwnerProfits[i-1] + monthly_total_profit)
    print('Monthly Profit:', round(monthly_total_profit, 2), 'MATIC (', round(ownerProfits_from_deposits[i],2), '+', round(rewards_from_SUFmax,2), '-', round(losses_from_unstaking_fee[i],2), '-', round(losses_from_staking_fee[i],2), ')' )
    print('Total Profits:', round(totalOwnerProfits[i],2), 'MATIC')

    # Note: since the fees for staking are paid anyway, we can restake the monthly rewards
    totalDeposits = totalDeposits + rewards_from_deposits + newMonthlyDeposits - newMonthlyWithdrawals



plt.figure('Profit from staking SUFmax funds for a N months without restaking')
plt.plot(compoundedSUFmaxProfit, color = 'g', label='SUFmax staked for ' + str(NumberofMonths) + ' months')
plt.plot(totalOwnerProfits, color = 'b', label='SUFmax used to stake & restake for ' + str(NumberofMonths) + ' months')
plt.axhline(y = 0, color = 'r', linestyle = '--')
plt.title('SUFmax =' + str(round(SUFmax, 2)) + ' MATIC, newMonthlyDeposits =' + str(newMonthlyDeposits) + ' MATIC, newMonthlyWithdrawals =' + str(newMonthlyWithdrawals) + ' MATIC')
plt.ylabel('Profit (MATIC)')
plt.xlabel('Months')
plt.legend()
plt.show()



