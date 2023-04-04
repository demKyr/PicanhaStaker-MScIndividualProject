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
Sinit=30000
Uinit=1500
init_newDeposit = 15000 # MATIC
init_smallStakeFee = 0.5 # 20%
min_newDeposit = 0
max_newDeposit = 30000




def XPY (days):
    return (1+DPY)**days - 1




# The parametrized function to be plotted
def simpleStaking(t, S, U):
    return (S + U) * XPY(t) - stakeFee - unstakeFee


def approachB(t, S, U, newDeposit, smallStakeFee):
    # return newDeposit * XPY(t) * (1 - smallStakeFee)
    return ((S + newDeposit - newDeposit % (S-U) ) * XPY(t) ) - newDeposit * XPY(t) * (1-smallStakeFee) - (int(newDeposit / (S-U) + 1) * (stakeFee + unstakeFee)) 

t = np.linspace(0, num_of_days, num_of_days)




# Create the figure and the line that we will manipulate
fig, ax = plt.subplots()
line1, = ax.plot(t, simpleStaking(t, Sinit, Uinit), lw=2, label = "Simple staking")
line2, = ax.plot(t, approachB(t, Sinit, Uinit, init_newDeposit, init_smallStakeFee), lw=2, label = "Approach B")
ax.set_ylabel('Profit [MATIC]')
ax.set_xlabel('Time [days]')
ax.set_ylim(-40, 1500)
ax.axhline(y = 0, color = 'y', linestyle = '--')
ax.axhline(y = stakeFee + unstakeFee, color = 'r', linestyle = '--')

# adjust the main plot to make room for the sliders
fig.subplots_adjust(bottom=0.4)


# Make a horizontal slider to control S
axS = fig.add_axes([0.25, 0.1, 0.65, 0.03])
S_slider = Slider(
    ax=axS,
    label='S',
    valmin=0,
    valmax=30000,
    valinit=Sinit,
    valstep=500,
)

# Make a horizontal slider to control U
axU = fig.add_axes([0.25, 0.15, 0.65, 0.03])
U_slider = Slider(
    ax=axU,
    label='U',
    valmin=0,
    valmax=30000,
    valinit=Uinit,
    valstep=500,
)

# Make a horizontal slider to control the deposit amount
axdeposit = fig.add_axes([0.25, 0.2, 0.65, 0.03])
deposit_slider = Slider(
    ax=axdeposit,
    label='new Deposit [MATIC]',
    valmin=min_newDeposit,
    valmax=max_newDeposit,
    valinit=init_newDeposit,
    valstep=500,
)

# Make a horizontal slider to control the smallStake fee
axsmallStakefee = fig.add_axes([0.25, 0.25, 0.65, 0.03])
smallStakeFee_slider = Slider(
    ax=axsmallStakefee,
    label="SmallStake fee",
    valmin=0,
    valmax=1,
    valinit=init_smallStakeFee,
    valstep=0.05,
)



# The function to be called anytime a slider's value changes
def update(val):
    line1.set_ydata(simpleStaking(t, S_slider.val, U_slider.val))
    line2.set_ydata(approachB(t, S_slider.val, U_slider.val, deposit_slider.val, smallStakeFee_slider.val))
    
    fig.canvas.draw_idle()


# register the update function with each slider
S_slider.on_changed(update)
U_slider.on_changed(update)
deposit_slider.on_changed(update)
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
ax.text(0.05, 0.95, textstr, transform=ax.transAxes, fontsize=14,
        verticalalignment='top', bbox=props)


def reset(event):
    S_slider.reset()
    U_slider.reset()
    deposit_slider.reset()
    smallStakeFee_slider.reset()
button.on_clicked(reset)

ax.legend(loc='upper right')
plt.show()
