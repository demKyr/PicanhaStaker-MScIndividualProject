import { Fragment } from "react";
import ReviewCaptionList from "./review-caption-list";

function ReviewCaptionListOfLists(props) {
  return (
    <Fragment>
      {!props.capsPerModel.length && (
        <p className="noOutputMsg">No available captions</p>
      )}
      <ul>
        {props.capsPerModel.map((model) => (
          <ReviewCaptionList
            key={model.key}
            myName={model.name}
            myDescription={model.description}
            myLabels={model.labels}
            myModelId={model.modelId}
            myCaptions={model.captions}
            onReviewCaption={props.onReviewCaption}
          />
        ))}
      </ul>
    </Fragment>
  );
}

export default ReviewCaptionListOfLists;
