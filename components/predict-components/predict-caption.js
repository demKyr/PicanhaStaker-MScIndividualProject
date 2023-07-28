import { useRef, useState } from "react";
import { useWeb3React } from "@web3-react/core";

import Button from "../ui/button";
import classes from "./predict-caption.module.css";
import ModalComponent from "../subcomponents/modal-component";
import { APIpath } from "../../constants/parameters";

function PredictCaption(props) {
  const captionInputRef = useRef();
  const { activate, active, library: provider } = useWeb3React();
  const [data, setData] = useState(null);

  function submitHandler(event) {
    event.preventDefault();

    const givenCaption = captionInputRef.current.value;

    if (givenCaption.length > 0) {

      if (active) {
        try {
          const reqOptions = {
            method: "POST",
            // mode: "cors",
            // headers: {
            // "Content-Type": "application/json",
            // },
            body: JSON.stringify({ caption: givenCaption }),
          };

          fetch(APIpath + "/test?model=" + props.myId, reqOptions)
            .then((res) => res.json())
            .then((contents) => {
              setData(contents["prediction"]);
            });
        } catch (error) {
          console.log(error);
        }
      } else {
        document.getElementById("executeButton").innerHTML =
          "Please install Metamask";
      }
    }
  }

  return (
    <div>
      <ModalComponent
        myName={props.myName}
        myDescription={props.myDescription}
      />
      <form className={classes.form} onSubmit={submitHandler}>
        <div className={classes.controls}>
          <div className={classes.mainControl}>
            <label htmlFor="caption">Caption</label>
            <input type="text" required id="caption" ref={captionInputRef} />
          </div>
          <div className={classes.secondaryControl}>
            <Button>Predict Caption</Button>
          </div>

          <div className={classes.secondaryControl}>
            {data && (
              <label htmlFor="prediction" id={classes.prediction}>
                {data}
              </label>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default PredictCaption;
