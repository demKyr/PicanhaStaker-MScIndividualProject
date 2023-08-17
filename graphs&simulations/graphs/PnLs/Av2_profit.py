import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button


# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
num_of_days = 365
truStakeFee = 0.1 

# Simulation parameters
init_round = 7 # days
init_deposits = 15000 # MATIC
init_smallStakeFee = 20 # 20%
min_deposits = 0
max_deposits = 100000




def XPY (days):
    return (1+DPY)**days - 1


def SUFfromRound (days):
    return max(stakeFee, unstakeFee) / XPY(days)


# The parametrized function to be plotted
def simpleStaking(t, SUF):
    return SUF * XPY(t)


def approachA(t, deposits, smallStakeFee):
    return deposits * XPY(t) * smallStakeFee

t = np.linspace(0, num_of_days, num_of_days)




# Create the figure and the line that we will manipulate
fig, ax = plt.subplots()
line1, = ax.plot(t, simpleStaking(t, SUFfromRound(init_round)), lw=2, label = "Simple staking", linestyle = '--')
line2, = ax.plot(t, approachA(t, init_deposits, init_smallStakeFee/100), lw=2, label = "Approach A")

ax.set_title('Approach A: protocol\'s profit wrt time', fontsize=20)
ax.set_ylabel('Profit [MATIC]', fontsize=16)
ax.set_xlabel('Time [days]', fontsize=16)
ax.set_ylim(-40, 1500)
ax.axhline(y=0, color='y', linestyle='--')
# ax.axhline(y=stakeFee + unstakeFee, color='r', linestyle='--')
ax.tick_params(axis='both', which='major', labelsize=16)

# adjust the main plot to make room for the sliders
fig.subplots_adjust(bottom=0.4)



# # Make a horizontal slider to control the withdraw amount
# axwithdraw = fig.add_axes([0.25, 0.1, 0.65, 0.03])
# withdraw_slider = Slider(
#     ax=axwithdraw,
#     label='new daily Withdrawals [MATIC]',
#     valmin=min_newWithdraw,
#     valmax=max_newWithdraw,
#     valinit=init_newWithdraw,
#     valstep=500,
# )

# Make a horizontal slider to control the total deposit amount
axdeposits = fig.add_axes([0.25, 0.15, 0.65, 0.03])
deposits_slider = Slider(
    ax=axdeposits,
    label='Total Deposits [MATIC]',
    valmin=min_deposits,
    valmax=max_deposits,
    valinit=init_deposits,
    valstep=500,
)
deposits_slider.label.set_fontsize(16)
deposits_slider.valtext.set_fontsize(16)

# Make a horizontal slider to control the round amount
axround = fig.add_axes([0.25, 0.2, 0.65, 0.03])
round_slider = Slider(
    ax=axround,
    label='Round duration [days]',
    valmin=1,
    valmax=60,
    valinit=init_round,
    valstep=1,
)
round_slider.label.set_fontsize(16)
round_slider.valtext.set_fontsize(16)


# Make a horizontal slider to control the fee on rewards [%]
axsmallStakefee = fig.add_axes([0.25, 0.25, 0.65, 0.03])
smallStakeFee_slider = Slider(
    ax=axsmallStakefee,
    label="Fee on rewards [%]",
    valmin=0,
    valmax=100,
    valinit=init_smallStakeFee,
    valstep=5,
)
smallStakeFee_slider.label.set_fontsize(16)
smallStakeFee_slider.valtext.set_fontsize(16)



# The function to be called anytime a slider's value changes
def update(val):
    line1.set_ydata(simpleStaking(t, SUFfromRound(round_slider.val)))
    line2.set_ydata(approachA(t, deposits_slider.val, smallStakeFee_slider.val/100))

    textstr2 = (r'SUF=$%.2f$ MATIC' % (SUFfromRound(round_slider.val), ))
    suf_txt.set_text(textstr2)
    fig.canvas.draw_idle()


# register the update function with each slider
deposits_slider.on_changed(update)
round_slider.on_changed(update)
smallStakeFee_slider.on_changed(update)

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
ax.text(0.05, 0.95, textstr, transform=ax.transAxes, fontsize=18,
        verticalalignment='top', bbox=props)



textstr2 = (r'SUF=$%.2f$ MATIC' % (SUFfromRound(round_slider.val), ))
suf_txt = ax.text(0.45, 0.95, textstr2, transform=ax.transAxes, fontsize=18, verticalalignment='top', bbox=props)




def reset(event):
    deposits_slider.reset()
    round_slider.reset()
    smallStakeFee_slider.reset()
button.on_clicked(reset)

ax.legend(loc='upper right', fontsize=18)
plt.show()


