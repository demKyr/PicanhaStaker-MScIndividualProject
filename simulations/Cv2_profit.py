import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button
from Cv2_importer import ApproachC


# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
num_of_days = 365

# Simulation parameters
initialVaultInjection = 1000
feeInit=0.1
depositFee=0.001
withdrawFee=0.001
expiryPeriodParam = 7 * 86400
initialAmountInValidatorInit = 10000
dailyDepositsInit = 1500
dailyWithdrawalsInit = 1000

t = np.linspace(0, num_of_days, num_of_days)

def XPY (days):
    return (1+DPY)**days - 1

def approachCsim(fee, dailyDeposits, dailyWithdrawals):
    AC = ApproachC(fee=fee, depositFee=depositFee, withdrawFee=withdrawFee, expiryPeriodParam = expiryPeriodParam)
    AC.initialisation()
    AC.show_state()
    profitsFromRewards = []
    for day in range(num_of_days):
        AC.time_pass(1)
        AC.deposit('user', dailyDeposits)
        AC.withdraw('user', dailyWithdrawals)
        profitsFromRewards.append(AC.shares['Treasury'] * AC.sharePx() + (AC.VaultBalances['claimedRewards'] + AC.VaultBalances['rewards']) * fee)
    return profitsFromRewards


# Create the figure and the line that we will manipulate
fig, ax = plt.subplots()
profitsFromRewards = approachCsim(initialAmountInValidatorInit, dailyDepositsInit, dailyWithdrawalsInit)
line1, = ax.plot(t, profitsFromRewards, lw=2, label = "Profit from rewards")
ax.set_ylabel('Profit [MATIC]')
ax.set_xlabel('Deposit [MATIC]')
# ax.set_ylim(-40, 1500)
ax.axhline(y = 0, color = 'y', linestyle = '--')

# adjust the main plot to make room for the sliders
fig.subplots_adjust(bottom=0.4)


# Make a horizontal slider to control fee
axFee = fig.add_axes([0.25, 0.1, 0.65, 0.03])
fee_slider = Slider(
    ax=axFee,
    label='Fee',
    valmin=0,
    valmax=1,
    valinit=feeInit,
    valstep=0.05,
)

# Make a horizontal slider to control dailyDeposits
axDailyDeposits = fig.add_axes([0.25, 0.15, 0.65, 0.03])
dailyDeposits_slider = Slider(
    ax=axDailyDeposits,
    label='dailyDeposits',
    valmin=0,
    valmax=30000,
    valinit=dailyDepositsInit,
    valstep=500,
)

# Make a horizontal slider to control dailyWithdrawals
axDailyWithdrawals = fig.add_axes([0.25, 0.2, 0.65, 0.03])
dailyWithdrawals_slider = Slider(
    ax=axDailyWithdrawals,
    label='dailyWithdrawals',
    valmin=0,
    valmax=30000,
    valinit=dailyWithdrawalsInit,
    valstep=500,
)






# The function to be called anytime a slider's value changes
def update(val):

    profitsFromRewards = approachCsim(fee_slider.val, dailyDeposits_slider.val, dailyWithdrawals_slider.val)

    ax.set_ylim(-10, 1.05 * max(profitsFromRewards))
    line1.set_ydata(profitsFromRewards)
    
    fig.canvas.draw_idle()


# register the update function with each slider
fee_slider.on_changed(update)
dailyDeposits_slider.on_changed(update)
dailyWithdrawals_slider.on_changed(update)

# Create a `matplotlib.widgets.Button` to reset the sliders to initial values.
resetax = fig.add_axes([0.8, 0.025, 0.1, 0.04])
button = Button(resetax, 'Reset', hovercolor='0.975')



textstr = '\n'.join((
    r'DPY=$%.4f$%%' % (DPY*100, ),
    r'MPY(30days)=$%.4f$%%' % (XPY(30)*100, ),
    r'Stake fee=$%.2f$ MATIC' % (stakeFee, ),
    r'Unstake fee=$%.2f$ MATIC' % (unstakeFee, )))

props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)

# place a text box in upper left in axes coords
ax.text(0.05, 0.95, textstr, transform=ax.transAxes, fontsize=14,
        verticalalignment='top', bbox=props)


def reset(event):
    fee_slider.reset()
    dailyDeposits_slider.reset()
    dailyWithdrawals_slider.reset()
button.on_clicked(reset)

ax.legend(loc='upper right')
plt.show()
