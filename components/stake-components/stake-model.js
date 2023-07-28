import { useRef } from "react";

import Button from "../ui/button";
import classes from "./stake-model.module.css";

function StakeModel(props) {
  const AmountInputRef = useRef();

  function submitHandler(event) {
    event.preventDefault();

    const givenAmount = AmountInputRef.current.value;

    if (!isNaN(+givenAmount)) {
      props.onStakeModel(
        givenAmount,
      );
    }
  }

  return (
    <form className={classes.form} onSubmit={submitHandler}>
      <div className={classes.controls}>


        <div className={classes.mainControl}>
          <label htmlFor="NumOfVotes">Amount</label>
          <input
            type="text"
            required
            id="NumOfVotes"
            ref={AmountInputRef}
          />
        </div>

        <div className={classes.secondaryControl}>
          <Button>Indirect Stake</Button>
        </div>

        <div className={classes.secondaryControl}>
          <Button>Direct Stake</Button>
        </div>

      </div>
    </form>
  );
}

export default StakeModel;
