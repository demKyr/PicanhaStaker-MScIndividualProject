import { Fragment } from "react";
import PredictCaption from "./predict-caption.js";

function PredictCaptionList(props) {
  return (
    <Fragment>
      {!props.models.length && (
        <p className="noOutputMsg">No available models</p>
      )}
      <ul>
        {props.models.map((model) => (
          <PredictCaption
            key={model.key}
            myName={model.name}
            myDescription={model.description}
            myLabels={model.labels}
            myId={model.id}
            onPredictCaption={props.onPredictCaption}
          />
        ))}
      </ul>
    </Fragment>
  );
}
export default PredictCaptionList;
