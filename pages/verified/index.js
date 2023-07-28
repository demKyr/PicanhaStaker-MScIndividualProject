import { useWeb3React } from "@web3-react/core";
import { useState, useContext, useRef, useEffect } from "react";

import ContractsContext from "../../store/contract-context";
import VerifiedCaptionListOfLists from "../../components/verified-components/verified-caption-listOfLists";


function VerifyPage() {
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
            if (modelsDataInput[key][6] == signerAddr) {
              const captionsPerModelInstance = {
                key: key,
                modelId: parseInt(modelsDataInput[key][0]),
                name: modelsDataInput[key][1],
                description: modelsDataInput[key][2],
                labels: modelsDataInput[key][5],
                captions: [],
              };
              captionsPerModel[parseInt(modelsDataInput[key][0])] =
                captionsPerModelInstance;
            }
          }
          const captionsDataInput = await contractsCtx.contracts[
            "staker"
          ].getCaptions();
          for (const key in captionsDataInput) {
            if (
              captionsDataInput[key][5] &&
              captionsPerModel.hasOwnProperty(captionsDataInput[key][1])
            ) {
              const captionData = {
                id: key,
                content: captionsDataInput[key][0],
                proposedLbl: captionsDataInput[key][2],
                verifiedLbl: captionsDataInput[key][3],
                goodData:
                  captionsDataInput[key][3] == captionsDataInput[key][2],
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

  if (isLoading) {
    return (
      <section>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <div>
      <h1 className="instruction">Verified Captions</h1>
      <VerifiedCaptionListOfLists capsPerModel={loadedCaptions} />
    </div>
  );
}

export default VerifyPage;
