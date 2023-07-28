import { Fragment } from "react";
import EvaluationModel from "./evaluation-model";

function EvaluationModelList(props) {
  return (
    <Fragment>
      {!props.infoPerModel.length && (
        <p className="noOutputMsg">No available models</p>
      )}
      <ul>
        {props.infoPerModel.map((model) => (
          <EvaluationModel
            key={model.key}
            myId={model.id}
            myName={model.name}
            myDescription={model.description}
            myLabels={model.labels}
            myAccuracy={model.accuracy}
          />
        ))}
      </ul>
    </Fragment>
  );
}
export default EvaluationModelList;
