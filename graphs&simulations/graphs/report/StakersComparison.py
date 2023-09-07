import matplotlib.pyplot as plt

# Data
platforms = ['TruStake', 'Lido', 'Stader']

average_deposit = [364069, 642379, 568917]
average_request_withdraw = [436289, 1174935, 779693]
average_claim_withdraw = [172892, 226251, 167478]

# Apply transformations
average_deposit = [(val * 30.45 * 1896) / 1e9 for val in average_deposit]
average_request_withdraw = [(val * 30.45 * 1896) / 1e9 for val in average_request_withdraw]
average_claim_withdraw = [(val * 30.45 * 1896) / 1e9 for val in average_claim_withdraw]

# Custom colors for each platform
platform_colors = {
    'TruStake': (0.161, 0.169, 0.263),  # RGB values (0-1)
    'Lido': (0.267, 0.6, 0.922),
    'Stader': (0.294, 0.643, 0.376)
}

# Set font size
plt.rcParams.update({'font.size': 12})

# Create bar plots with custom colors and increased font sizes
plt.figure(figsize=(10, 6))
plt.bar(platforms, average_deposit, color=[platform_colors[p] for p in platforms])
plt.title("Average Deposit Gas Fee", fontsize=22)
plt.xlabel("Staker", fontsize=20)
plt.ylabel("Value (in $)", fontsize=20)
plt.xticks(fontsize=18)
plt.yticks(fontsize=18)
plt.show()

plt.figure(figsize=(10, 6))
plt.bar(platforms, average_request_withdraw, color=[platform_colors[p] for p in platforms])
plt.title("Average Request Withdraw Gas Fee", fontsize=22)
plt.xlabel("Staker", fontsize=20)
plt.ylabel("Value (in $)", fontsize=20)
plt.xticks(fontsize=18)
plt.yticks(fontsize=18)
plt.show()

plt.figure(figsize=(10, 6))
plt.bar(platforms, average_claim_withdraw, color=[platform_colors[p] for p in platforms])
plt.title("Average Claim Withdraw Gas Fee", fontsize=22)
plt.xlabel("Staker", fontsize=20)
plt.ylabel("Value (in $)", fontsize=20)
plt.xticks(fontsize=18)
plt.yticks(fontsize=18)
plt.show()

# Total plots
total_Trustake = average_deposit[0] + average_request_withdraw[0] + average_claim_withdraw[0]
total_Lido = average_deposit[1] + average_request_withdraw[1] + average_claim_withdraw[1]
total_Stader = average_deposit[2] + average_request_withdraw[2] + average_claim_withdraw[2]

plt.figure(figsize=(10, 6))
plt.bar(platforms, [total_Trustake, total_Lido, total_Stader], color=[platform_colors[p] for p in platforms])
plt.title("Average Total Gas Fees for Staking & Unstaking", fontsize=22)
plt.xlabel("Staker", fontsize=20)
plt.ylabel("Total Value (in $)", fontsize=20)
plt.xticks(fontsize=18)
plt.yticks(fontsize=18)
plt.show()
