import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button

def XPY (DPY, days):
    return (1+DPY)**days - 1

# Non-adjustable constants
DPY = 0.000128 # 0.0128%
stakeFee = 15 # MATIC
unstakeFee = 15 # MATIC
num_of_days = 30

# Simulation parameters
init_newDeposit = 15000 # MATIC
init_ownerFee = 0.5 # 20%
min_newDeposit = 0
max_newDeposit = 50000


# The parametrized function to be plotted
def f(t, newDeposit, ownerFee):
    return newDeposit * XPY(DPY,t) * ownerFee

t = np.linspace(0, num_of_days, num_of_days)


# Create the figure and the line that we will manipulate
fig, ax = plt.subplots()
line, = ax.plot(t, f(t, init_newDeposit, init_ownerFee), lw=2)
ax.set_ylabel('Profit from rewards from the new deposit [MATIC]')
ax.set_xlabel('Time [days]')
ax.set_ylim(0, 100)
ax.axhline(y = stakeFee, color = 'y', linestyle = '--')
ax.axhline(y = stakeFee + unstakeFee, color = 'r', linestyle = '--')

# adjust the main plot to make room for the sliders
fig.subplots_adjust(bottom=0.35)


# Make a horizontal slider to control the deposit.
axdeposit = fig.add_axes([0.25, 0.1, 0.65, 0.03])
deposit_slider = Slider(
    ax=axdeposit,
    label='new Deposit [MATIC]',
    valmin=min_newDeposit,
    valmax=max_newDeposit,
    valinit=init_newDeposit,
    valstep=100,
)

# Make a horizontal slider to control the owner fee
axownerfee = fig.add_axes([0.25, 0.2, 0.65, 0.03])
ownerFee_slider = Slider(
    ax=axownerfee,
    label="Owner fee",
    valmin=0,
    valmax=1,
    valinit=init_ownerFee,
    valstep=0.05,
)


# The function to be called anytime a slider's value changes
def update(val):
    line.set_ydata(f(t, deposit_slider.val, ownerFee_slider.val))
    fig.canvas.draw_idle()


# register the update function with each slider
deposit_slider.on_changed(update)
ownerFee_slider.on_changed(update)

# Create a `matplotlib.widgets.Button` to reset the sliders to initial values.
resetax = fig.add_axes([0.8, 0.025, 0.1, 0.04])
button = Button(resetax, 'Reset', hovercolor='0.975')



textstr = '\n'.join((
    r'DPY=$%.4f$%%' % (DPY*100, ),
    r'MPY(30days)=$%.4f$%%' % (XPY(DPY,30)*100, ),
    r'Stake fee=$%.2f$ MATIC' % (stakeFee, ),
    r'Unstake fee=$%.2f$ MATIC' % (unstakeFee, )))

props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)

# place a text box in upper left in axes coords
ax.text(0.05, 0.95, textstr, transform=ax.transAxes, fontsize=14,
        verticalalignment='top', bbox=props)


def reset(event):
    deposit_slider.reset()
    ownerFee_slider.reset()
button.on_clicked(reset)

plt.show()
