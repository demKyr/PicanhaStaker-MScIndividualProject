import { useEffect, useRef, useState } from "react";
import Button from "../ui/button";
import classes from "./unstake-model.module.css";

function UnstakeModel(props) {
  const AmountInputRef = useRef();

  function submitHandler(event) {
    event.preventDefault();
  }

  function handleIndirectUnstake() {
    const amount = AmountInputRef.current.value;
    if (!isNaN(+amount)) {
      props.onIndirectUnstake(amount);
    }
  }

  function handleDirectUnstake() {
    const amount = AmountInputRef.current.value;
    if (!isNaN(+amount)) {
      props.onDirectUnstake(amount);
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
          <Button onClick={handleIndirectUnstake}>
            Indirect Unstake
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> + 0.1% fee <br/> processed within 7 days
              <br/> <br/> Minimum amount: 100 MATIC
            </div>
          </Button>
          <Button onClick={handleDirectUnstake}>
            Direct Unstake
            <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
              <br/> + staking fee <br/> processed immediately
              <br/> <br/>No minimum amount
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UnstakeModel;