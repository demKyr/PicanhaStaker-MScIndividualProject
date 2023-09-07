import matplotlib.pyplot as plt

stakeData = [281518, 372717, 405287, 590878, 322729, 452455, 364069, 642379, 568917]
stakeLabels = [ "Picanha\n(ind):\nno pair", 
                "Picanha\n(ind):\npair", 
                "Picanha\n(dir):\nstake only\n(1 tx)", 
                "Picanha\n(dir):\nstake only\n(10 txs)", 
                "Picanha\n(dir):\npair only\n(1-3 txs)", 
                "Picanha\n(dir):\npair + stake\n(1 tx)",
                "TruStake",
                "Lido",
                "Stader"
               ]

stakeColors = [
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (0.161, 0.169, 0.263),
    (0.267, 0.6, 0.922),
    (0.294, 0.643, 0.376)
]

plt.figure(figsize=(10, 6))
plt.bar(stakeLabels, stakeData, color=stakeColors)
plt.title("Average Stake Gas Fee", fontsize=18)
plt.xlabel("Staker", fontsize=16)
plt.ylabel("Value (in gas units)", fontsize=16)
plt.xticks(fontsize=14)
plt.yticks(fontsize=14)
plt.show()


unstakeData = [268481, 369196, 559261, 335122, 601128, 609181, 1401186, 947171]

unstakeLabels = [ "Picanha\n(ind):\nno pair",
                  "Picanha\n(ind):\npair",    
                  "Picanha\n(dir):\nunstake only",
                  "Picanha\n(dir):\npair only\n(1-3 txs)",
                  "Picanha\n(dir):\npair + unstake\n(1 tx)",
                  "TruStake",
                  "Lido",
                  "Stader"
               ]

unstakeColors = [
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (117/255, 251/255, 151/255),
    (0.161, 0.169, 0.263),
    (0.267, 0.6, 0.922),
    (0.294, 0.643, 0.376)
]

plt.figure(figsize=(10, 6))
plt.bar(unstakeLabels, unstakeData, color=unstakeColors)
plt.title("Average Unstake Gas Fee", fontsize=18)
plt.xlabel("Staker", fontsize=16)
plt.ylabel("Value (in gas units)", fontsize=16)
plt.xticks(fontsize=14)
plt.yticks(fontsize=14)
plt.show()