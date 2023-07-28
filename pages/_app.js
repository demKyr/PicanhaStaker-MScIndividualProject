import "../styles/globals.css";
import { Web3ReactProvider } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";

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
  return (
    <ContractsContextProvider>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Web3ReactProvider>
    </ContractsContextProvider>
  );
}

export default MyApp;
