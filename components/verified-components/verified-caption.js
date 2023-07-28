import classes from "./verified-caption.module.css";

function VerifiedCaption(props) {
  return (
    <form
      className={props.myGoodData ? classes.goodDataForm : classes.badDataForm}
    >
      <div className={classes.controls}>
        <div className={classes.mainControl}>
          <label htmlFor="caption">Caption</label>
          <h2>{props.myCaption}</h2>
        </div>
        <div className={classes.secondaryControl}>
          <label htmlFor="lbl">Proposed Label</label>
          <h2>{props.myLabels[props.myProposedLbl]}</h2>
        </div>
        <div className={classes.secondaryControl}>
          <label htmlFor="lbl">Verified Label</label>
          <h2>{props.myLabels[props.myVerifiedLbl]}</h2>
        </div>
      </div>
    </form>
  );
}

export default VerifiedCaption;
