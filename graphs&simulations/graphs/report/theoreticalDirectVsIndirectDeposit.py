import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button

# parameters
stakeFee = 15  # MATIC
depositFee = 0.001  # 0.1%
minDepositAmount = 300  # MATIC
indirectDepositOverhead = 5
balancePoint = (stakeFee - indirectDepositOverhead) / depositFee
dQueueThreshold = balancePoint  # MATIC

# The parametrized function to be plotted
def directDeposit():
    return np.full_like(t, stakeFee)

def indirectDeposit(amount):
    return amount * depositFee + indirectDepositOverhead

t = np.linspace(0, 30000)

# Create the figure and the line that we will manipulate
fig, ax = plt.subplots()
line1, = ax.plot(t, directDeposit(), lw=2, label="directDeposit")
line2, = ax.plot(t, indirectDeposit(t), lw=2, label="indirectDeposit")

# Fill areas with colors
ax.fill_between(t+minDepositAmount, 0, indirectDeposit(t), where=(t <= balancePoint), interpolate=True, color='orange', alpha=0.3)
ax.fill_between(t-minDepositAmount, 0, directDeposit(), where=(t > balancePoint), interpolate=True, color='blue', alpha=0.3)

# Increase font sizes
ax.set_title('Cost comparison between direct deposit and indirect Deposit', fontsize=16)
ax.set_ylabel('Cost', fontsize=16)
ax.set_xlabel('Deposit amount', fontsize=16)
ax.tick_params(axis='both', labelsize=16)  # Increase tick label font size
ax.axvline(x=dQueueThreshold + minDepositAmount/2, color='r', linestyle='--', label="dQueueThreshold")
ax.axvline(x=minDepositAmount, color='y', linestyle='--', label="minDepositAmount")
ax.set_yticks([])
ax.set_xticks([])

fig.subplots_adjust(bottom=0.35)


ax.legend(loc='upper right', fontsize=16)
plt.show()
