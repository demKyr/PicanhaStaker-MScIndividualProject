import { useState, useRef } from "react";
import Button from "../ui/button";
import classes from "./stake-model.module.css";

function StakeModel(props) {
  const AmountInputRef = useRef();
  const [givenAmount, setGivenAmount] = useState("");

  function submitHandler(event) {
    event.preventDefault();
    const amount = AmountInputRef.current.value;
    if (!isNaN(+amount)) {
      setGivenAmount(amount);
      if (props.onIndirectStake) { 
        props.onIndirectStake(amount);
      } else if (props.onDirectStake) { 
        props.onDirectStake(amount);
      }
    }
  }

  return (
    <form className={classes.form} onSubmit={submitHandler}>
      <div className={classes.controls}>
        <div className={classes.mainControl}>
          <label htmlFor="Amount">Amount</label>
          <input
            type="text"
            required
            id="Amount"
            ref={AmountInputRef}
          />
        </div>

        <div className={classes.secondaryControl}>
          <Button onClick={props.onIndirectStake}>
            Indirect Stake
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> + 0.1% fee <br/> processed within 7 days
            </div>
          </Button>
          <Button onClick={props.onDirectStake}>
            Direct Stake
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> + staking fee <br/> processed immediately
            </div>
            </Button>
        </div>
      </div>
    </form>
  );
}

export default StakeModel;
