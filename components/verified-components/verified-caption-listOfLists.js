import { Fragment } from "react";

import VerifiedCaptionList from "./verified-caption-list";

function VerifiedCaptionListOfLists(props) {
  return (
    <Fragment>
      {!props.capsPerModel.length && (
        <p className="noOutputMsg">You have not requested any models</p>
      )}
      <ul>
        {props.capsPerModel.map((model) => (
          <VerifiedCaptionList
            key={model.key}
            myName={model.name}
            myDescription={model.description}
            myLabels={model.labels}
            myModelId={model.modelId}
            myCaptions={model.captions}
          />
        ))}
      </ul>
    </Fragment>
  );
}

export default VerifiedCaptionListOfLists;
