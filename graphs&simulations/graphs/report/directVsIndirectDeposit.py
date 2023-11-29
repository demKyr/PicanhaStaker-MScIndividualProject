import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button

# parameters
stakeFee = 15  # MATIC
dQueueThreshold = 15000  # MATIC
depositFee = 0.001  # 0.1%
minDepositAmount = 100  # MATIC

# The parametrized function to be plotted
def directDeposit():
    return np.full_like(t, stakeFee)

def indirectDeposit(amount):
    return amount * depositFee

t = np.linspace(0, 30000)

# Create the figure and the line that we will manipulate
fig, ax = plt.subplots()
line1, = ax.plot(t, directDeposit(), lw=2, label="directDeposit")
line2, = ax.plot(t, indirectDeposit(t), lw=2, label="indirectDeposit")

# Fill areas with colors
ax.fill_between(t, 0, indirectDeposit(t), where=(t <= dQueueThreshold) & (t >= minDepositAmount), interpolate=True, color='orange', alpha=0.3)
ax.fill_between(t, 0, directDeposit(), where=(t > dQueueThreshold), interpolate=True, color='blue', alpha=0.3)

# Increase font sizes
ax.set_title('Cost comparison between directDeposit() and indirectDeposit()', fontsize=16)
ax.set_ylabel('Cost [MATIC]', fontsize=16)
ax.set_xlabel('Deposit amount [MATIC]', fontsize=16)
ax.tick_params(axis='both', labelsize=16)  # Increase tick label font size
ax.axvline(x=dQueueThreshold, color='r', linestyle='--', label="dQueueThreshold")
ax.axvline(x=minDepositAmount, color='y', linestyle='--', label="minDepositAmount")

fig.subplots_adjust(bottom=0.35)

textstr = '\n'.join((
    r'dQueueThreshold = $%.2f$ MATIC' % (dQueueThreshold, ),
    r'depositFee(%%) = $%.1f$%%' % (depositFee*100, ),
    r'Stake fee = $%.2f$ MATIC' % (stakeFee, )))

props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)

# place a text box in upper left in axes coords
ax.text(0.05, 0.95, textstr, transform=ax.transAxes, fontsize=16,
        verticalalignment='top', bbox=props)

ax.legend(loc='upper right', fontsize=16)
plt.show()
