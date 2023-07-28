import { useWeb3React } from "@web3-react/core";
import { useState, useContext, useRef, useEffect } from "react";

import ContractsContext from "../../store/contract-context";
import EvaluationModelList from "../../components/evaluation-components/evaluation-model-list";

function EvaluationPage() {
  const { activate, active, library: provider } = useWeb3React();
  const contractsCtx = useContext(ContractsContext);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedModelInfo, setLoadedModelInfo] = useState([]);
  const signer = provider.getSigner();

  useEffect(() => {
    async function fetchData() {
      if (active) {
        setIsLoading(true);
        try {
          const signerAddr = await signer.getAddress();
        const modelInfo = [];

          const modelsDataInput = await contractsCtx.contracts[
            "staker"
          ].getModels();

          for (const key in modelsDataInput) {
            if (modelsDataInput[key][6] == signerAddr) {
              const modelInfoInstance = {
                key: key,
                modelId: parseInt(modelsDataInput[key][0]),
                name: modelsDataInput[key][1],
                description: modelsDataInput[key][2],
                labels: modelsDataInput[key][5],
                accuracy: modelsDataInput[key][7]
              };
              modelInfo[parseInt(modelsDataInput[key][0])] = modelInfoInstance;
            }
          }
          setIsLoading(false);
          setLoadedModelInfo(modelInfo);
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
      <h1 className="instruction">Evaluation</h1>
      <EvaluationModelList infoPerModel={loadedModelInfo} />
    </div>
  );
}

export default EvaluationPage;
