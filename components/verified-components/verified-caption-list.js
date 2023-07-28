import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { Fragment, useContext } from "react";
// import { useRouter } from "next/router";
import Router from 'next/router'

import ContractsContext from "../../store/contract-context";
import { APIpath } from "../../constants/parameters";
import Button from "../ui/button";
import VerifiedCaption from "./verified-caption";
import ModalComponent from "../subcomponents/modal-component";
import classes from "./verified-caption-list.module.css";

function VerifiedCaptionList(props) {
  const { activate, active, library: provider } = useWeb3React();
  const contractsCtx = useContext(ContractsContext);

  async function saveAccuracy(modelId, acc) {
    if (active) {
      try {
        let intAcc = parseInt(acc * 100000);
        await contractsCtx.contracts["staker"].addAccuracy(
          modelId,
          intAcc
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  async function hideUsedCaptions(usedCaptions) {
    if (active) {
      try {
        let usedCaptionsIds = [];
        for (const key in usedCaptions) {
          usedCaptionsIds.push(parseInt(usedCaptions[key]["id"]));
        }
        await contractsCtx.contracts["staker"].updateCaptionTrainStatus(
          usedCaptionsIds.reverse()
        );
        Router.push({pathname: "/evaluation",});
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  function trainHandler(event) {
    event.preventDefault();

    if (active) {
      try {
        alert(
          "Training has started!\n\nPlease wait until Metamask windows appear to verify the training\n\nDo not leave the page!"
        );
        let trainData = props.myCaptions;
        // Create request for Training
        const reqOptions = {
          method: "POST",
          body: JSON.stringify(trainData),
        };
        // Make API call for training
        fetch(APIpath + "/train?model=" + props.myModelId, reqOptions)
          .then((res) => res.json())
          .then((contents) => {
            if (contents["status"] == "ok") {
              //Make API call for evaluation to receive loss and accuracy
              try {
                fetch(APIpath + "/evaluate?model=" + props.myModelId)
                  .then((res) => res.json())
                  .then((contents) => {
                    let acc = contents["acc"];
                    let loss = contents["loss"];
                    saveAccuracy(props.myModelId, acc);
                    hideUsedCaptions(trainData);
                  });
              } catch (error) {
                console.log(error);
              }
            }
          });
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  return (
    <ul>
      <ModalComponent
        myName={props.myName}
        myDescription={props.myDescription}
      />
      {!props.myCaptions.length ? (
        <p className="noOutputMsg">No captions available for this model</p>
      ) : (
        <Fragment>
          {props.myCaptions.map((caption) => (
            <VerifiedCaption
              key={caption.id}
              myCaption={caption.content}
              myProposedLbl={caption.proposedLbl}
              myVerifiedLbl={caption.verifiedLbl}
              myGoodData={caption.goodData}
              myLabels={props.myLabels}
            />
          ))}
          <div className={classes.trainButton}>
            <Button onClick={trainHandler}>Train Model</Button>
          </div>
        </Fragment>
      )}
    </ul>
  );
}

export default VerifiedCaptionList;
