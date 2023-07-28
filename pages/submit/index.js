import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useState, useContext, useRef, useEffect } from "react";

import ContractsContext from "../../store/contract-context";
import SubmitCaptionList from "../../components/submit-components/submit-caption-list";
import { CaptionCost } from "../../constants/parameters";

function SubmitPage() {
  const { activate, active, library: provider } = useWeb3React();
  const contractsCtx = useContext(ContractsContext);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedModels, setLoadedModels] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (active) {
        setIsLoading(true);
        try {
          const modelsData = [];
          const modelsDataInput = await contractsCtx.contracts[
            "staker"
          ].getModels();
          for (const key in modelsDataInput) {
            const modelData = {
              key: key,
              id: parseInt(modelsDataInput[key][0]),
              name: modelsDataInput[key][1],
              description: modelsDataInput[key][2],
              labels: modelsDataInput[key][5],
            };
            modelsData.push(modelData);
          }
          setIsLoading(false);
          setLoadedModels(modelsData);
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

  async function SubmitCaptionHandler(caption, lbl, modelId) {
    if (active) {
      try {
        await contractsCtx.contracts["staker"].addCaption(caption, lbl, modelId, {
          value: ethers.utils.parseEther(CaptionCost),
        });
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
      <h1 className="instruction">Submit a caption with its label</h1>
      <SubmitCaptionList
        models={loadedModels}
        onSubmitCaption={SubmitCaptionHandler}
      />
    </div>
  );
}

export default SubmitPage;
