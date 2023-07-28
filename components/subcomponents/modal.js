import Button from "../ui/button";
import classes from "./modal.module.css";

function Modal(props) {
  function cancelHandler() {
    props.onCancel();
  }

  return (
    <div className={classes.modal}>
      <h2>{props.myName}</h2>
      <label>Model Description:</label>
      <p>{props.myDescription}</p>
      <Button onClick={cancelHandler}>Close Info</Button>
    </div>
  );
}

export default Modal;
