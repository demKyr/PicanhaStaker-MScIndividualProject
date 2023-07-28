import { useRef } from "react";

import Button from "../ui/button";
import classes from "./request-model.module.css";

function RequestModel(props) {
  const nameInputRef = useRef();
  const descriptionInputRef = useRef();
  const NumOfVotesInputRef = useRef();
  const initialAccInputRef = useRef();
  const labelsInputRef = useRef();

  function submitHandler(event) {
    event.preventDefault();

    const givenName = nameInputRef.current.value;
    const givenDescription = descriptionInputRef.current.value;
    const givenNumOfVotes = NumOfVotesInputRef.current.value;
    const givenInitialAcc = initialAccInputRef.current.value;
    const givenlabels = labelsInputRef.current.value;

    if (!isNaN(+givenNumOfVotes) && !isNaN(+givenInitialAcc)) {
      props.onRequestModel(
        givenName,
        givenDescription,
        givenNumOfVotes,
        givenInitialAcc,
        givenlabels
      );
    }
  }

  return (
    <form className={classes.form} onSubmit={submitHandler}>
      <div className={classes.controls}>
        <div className={classes.mainControl} id={classes.Name}>
          <label htmlFor="Name">Name of Model</label>
          <input type="text" required id="Name" ref={nameInputRef} />
        </div>

        <div className={classes.mainControl}>
          <label htmlFor="description">Description</label>
          <textarea
            placeholder="Give short description of the model and give an example"
            required
            id="description"
            rows="5"
            ref={descriptionInputRef}
          ></textarea>
        </div>

        <div className={classes.mainControl}>
          <label htmlFor="NumOfVotes">Number of Votes for verification</label>
          <input
            type="text"
            required
            id="NumOfVotes"
            ref={NumOfVotesInputRef}
          />
        </div>

        <div className={classes.mainControl}>
          <label htmlFor="initialAcc">Initial Accuracy of the model (range [0,1])</label>
          <input
            type="text"
            required
            id="initialAcc"
            ref={initialAccInputRef}
          />
        </div>

        <div className={classes.mainControl}>
          <label htmlFor="labels">Labels</label>
          <textarea
            placeholder="Give the labels for the requested captions separated with commas and without spaces or quotes (eg Positive,Negative,Neutral)"
            required
            id="labels"
            rows="5"
            ref={labelsInputRef}
          ></textarea>
        </div>

        <div className={classes.secondaryControl}>
          <Button>Request Model</Button>
        </div>
      </div>
    </form>
  );
}

export default RequestModel;
