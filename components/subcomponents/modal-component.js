import { useState } from "react";

import classes from "./modal-component.module.css";
import Modal from "./modal";
import Backdrop from "./backdrop";

function ModalComponent(props) {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  function openModalHandler() {
    setModalIsOpen(true);
    console.log(props.myName, props.myDescription);
  }

  function closeModalHandler() {
    setModalIsOpen(false);
  }

  return (
    <div className={classes.modelName}>
      {/* <h2 onClick={openModalHandler}>{props.myName}</h2> */}
      <div className={classes.row}>
        <h2>{props.myName}</h2>
        <img src="./infoIcon.png" alt="(info)" onClick={openModalHandler} />
      </div>

      {modalIsOpen && (
        <Modal
          onCancel={closeModalHandler}
          myName={props.myName}
          myDescription={props.myDescription}
        />
      )}
      {modalIsOpen && <Backdrop onCancel={closeModalHandler} />}
    </div>
  );
}

export default ModalComponent;
