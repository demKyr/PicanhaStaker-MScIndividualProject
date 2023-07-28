import { useWeb3React } from "@web3-react/core";
import { useState, useContext, useRef, useEffect } from "react";

import ContractsContext from "../../store/contract-context";
import PredictCaptionList from "../../components/predict-components/predict-caption-list";

function PredictPage() {
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

  if (isLoading) {
    return (
      <section>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <div>
      <h1 className="instruction">Predict label for a caption</h1>
      <PredictCaptionList
        models={loadedModels}
      />
    </div>
  );
}

export default PredictPage;
