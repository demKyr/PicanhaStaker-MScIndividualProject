import { useRef, useState } from "react";

import Button from "../ui/button";
import classes from "./submit-caption.module.css";
import LblDropdown from "../subcomponents/lbl-dropdown";
import ModalComponent from "../subcomponents/modal-component";

function SubmitCaption(props) {
  const captionInputRef = useRef();
  const lblInputRef = useRef();

  function submitHandler(event) {
    event.preventDefault();

    const givenCaption = captionInputRef.current.value;
    const givenLbl = lblInputRef.current.value;

    if (!isNaN(+givenLbl) && givenCaption.length > 0) {
      props.onSubmitCaption(givenCaption, +givenLbl, props.myId);
    }
  }

  return (
    <div>
      <ModalComponent
        myName={props.myName}
        myDescription={props.myDescription}
      />
      <form className={classes.form} onSubmit={submitHandler}>
        <div className={classes.controls}>
          <div className={classes.mainControl}>
            <label htmlFor="caption">Caption</label>
            <input type="text" required id="caption" ref={captionInputRef} />
          </div>
          <div className={classes.secondaryControl}>
            <label htmlFor="lbl">Label</label>
            <select
              required
              defaultValue={"default"}
              id="lbl"
              ref={lblInputRef}
            >
              <LblDropdown refName={lblInputRef} labels={props.myLabels} />
            </select>
          </div>
          <div className={classes.secondaryControl}>
            <Button>Submit Caption</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SubmitCaption;
