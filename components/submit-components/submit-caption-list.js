import { Fragment } from "react";
import SubmitCaption from "./submit-caption";

function SubmitCaptionList(props) {
  return (
    <Fragment>
      {!props.models.length && (
        <p className="noOutputMsg">No available models</p>
      )}
      <ul>
        {props.models.map((model) => (
          <SubmitCaption
            key={model.key}
            myName={model.name}
            myDescription={model.description}
            myLabels={model.labels}
            myId={model.id}
            onSubmitCaption={props.onSubmitCaption}
          />
        ))}
      </ul>
    </Fragment>
  );
}
export default SubmitCaptionList;
