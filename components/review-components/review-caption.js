import { useRef } from "react";

import Button from "../ui/button";
import classes from "./review-caption.module.css";
import LblDropdown from "../subcomponents/lbl-dropdown";


function ReviewCaption(props) {
  const lblInputRef = useRef();

  function reviewHandler(event) {
    event.preventDefault();

    const givenLbl = lblInputRef.current.value;
    if (!isNaN(+givenLbl)) {
      props.onReviewCaption(props.myId, givenLbl, props.myModelId);
    }
  }

  return (
    <form className={classes.form} onSubmit={reviewHandler}>
      <div className={classes.controls}>
        <div className={classes.mainControl}>
          <label htmlFor="caption">Caption</label>
          <h2>{props.myCaption}</h2>
        </div>
        <div className={classes.secondaryControl}>
          <label htmlFor="lbl">Label</label>
          <select required defaultValue={"default"} id="lbl" ref={lblInputRef}>
            <LblDropdown refName={lblInputRef} labels={props.myLabels}/>
          </select>
        </div>
        <div className={classes.secondaryControl}>
          <Button>Review Caption</Button>
        </div>
      </div>
    </form>
  );
}

export default ReviewCaption;
