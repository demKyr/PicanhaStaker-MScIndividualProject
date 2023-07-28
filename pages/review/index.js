import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useState, useContext, useRef, useEffect } from "react";

import ContractsContext from "../../store/contract-context";
import ReviewCaptionListOfLists from "../../components/review-components/review-caption-listOfLists";
import { ReviewCost } from "../../constants/parameters";

function ReviewPage() {
  const { activate, active, library: provider } = useWeb3React();
  const contractsCtx = useContext(ContractsContext);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCaptions, setLoadedCaptions] = useState([]);
  const signer = provider.getSigner();

  useEffect(() => {
    async function fetchData() {
      if (active) {
        setIsLoading(true);
        try {
          const signerAddr = await signer.getAddress();
          const captionsPerModel = [];

          const modelsDataInput = await contractsCtx.contracts[
            "staker"
          ].getModels();
          for (const key in modelsDataInput) {
            const captionsPerModelInstance = {
              key: key,
              modelId: parseInt(modelsDataInput[key][0]),
              name: modelsDataInput[key][1],
              description: modelsDataInput[key][2],
              labels: modelsDataInput[key][5],
              captions: [],
            };
            captionsPerModel.push(captionsPerModelInstance);
          }

          const captionsDataInput = await contractsCtx.contracts[
            "staker"
          ].getCaptions();
          for (const key in captionsDataInput) {
            if (
              !captionsDataInput[key][5] &&
              !(captionsDataInput[key][6] == signerAddr) &&
              !captionsDataInput[key][7].includes(signerAddr)
            ) {
              const captionData = {
                id: key,
                content: captionsDataInput[key][0],
              };
              captionsPerModel[captionsDataInput[key][1]]["captions"].push(
                captionData
              );
            }
          }
          setIsLoading(false);
          setLoadedCaptions(captionsPerModel);
        } catch (error) {
          console.log(error);
        }
      } else {
        document.getElementById("executeButton").innerHTML =
          "Please install Metamask";
      }
    }
    fetchData();
  }, []);

  async function ReviewCaptionHandler(idx, lbl, modelId) {
    if (active) {
      try {
        await contractsCtx.contracts["staker"].reviewCaption(
          idx,
          lbl,
          modelId,
          {
            value: ethers.utils.parseEther(ReviewCost),
          }
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("executeButton").innerHTML =
        "Please install Metamask";
    }
  }

  if (isLoading) {
    return (
      <section>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <div>
      <h1 className="instruction">Review Captions</h1>
      <ReviewCaptionListOfLists
        capsPerModel={loadedCaptions}
        onReviewCaption={ReviewCaptionHandler}
      />
    </div>
  );
}

export default ReviewPage;
