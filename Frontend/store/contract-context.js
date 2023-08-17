import { createContext, useState } from "react";

const ContractsContext = createContext({
  contracts: {},
  addContract: (name, contract) => {},
});

export function ContractsContextProvider(props) {
  const [contracts, setContracts] = useState({});

  function addContractHandler(name, contract) {
    setContracts((prevContracts) => {
      const latestContract = {};
      latestContract[name] = contract;
      return {
        ...prevContracts,
        ...latestContract,
      };
    });
  }

  const context = {
    contracts: contracts,
    addContract: addContractHandler,
  };

  return (
    <ContractsContext.Provider value={context}>
      {props.children}
    </ContractsContext.Provider>
  );
}

export default ContractsContext;
