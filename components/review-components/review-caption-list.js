import ReviewCaption from "./review-caption";
import ModalComponent from "../subcomponents/modal-component";

function ReviewCaptionList(props) {
  return (
    <ul>
      <ModalComponent
        myName={props.myName}
        myDescription={props.myDescription}
      />
      {!props.myCaptions.length && (
        <p className="noOutputMsg">No captions available for this model</p>
      )}
      {props.myCaptions.map((caption) => (
        <ReviewCaption
          key={caption.id}
          myCaption={caption.content}
          myId={caption.id}
          myModelId={props.myModelId}
          myLabels={props.myLabels}
          onReviewCaption={props.onReviewCaption}
        />
      ))}
    </ul>
  );
}

export default ReviewCaptionList;
