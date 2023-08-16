import "../styles/globals.css";
import { Web3ReactProvider } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { useEffect, useState } from "react";

import Layout from "../components/layout/layout";
import { ContractsContextProvider } from "../store/contract-context";

const getLibrary = (provider) => {
  // The "any" network will allow spontaneous network changes
  provider = new Web3Provider(window.ethereum, "any");
  provider.on("network", (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      if (oldNetwork) {
          window.location.reload();
      }
  });
  return provider;
  // return new Web3Provider(provider);
};




function MyApp({ Component, pageProps }) {
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      window.location.reload();
    };

    const checkNetwork = async () => {
      try {
        const network = await window.ethereum.request({
          method: "net_version",
        });

        if (network !== "5") { // Goerli network ID is "5"
          setNetworkError(true);
        } else {
          setNetworkError(false);
        }
      } catch (error) {
        console.error("Error checking network:", error);
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      checkNetwork();

      window.ethereum.on("chainChanged", () => {
        checkNetwork();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  return (
    <ContractsContextProvider>
        {networkError ? (
          <div className="error-message">
            <p>Please switch your wallet to the Goerli test network.</p>
          </div>
        ) : (
          <Web3ReactProvider getLibrary={getLibrary}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Web3ReactProvider>
        )}
    </ContractsContextProvider>
  );
}

export default MyApp;
