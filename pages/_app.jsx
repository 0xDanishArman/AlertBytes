import { useState, useEffect } from "react";
import { MoralisProvider } from "react-moralis";
import Script from "next/script";
import Layout from "../Layout/Layout";
import "../styles/globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import StatusContext from "../store/status-context";

function MyApp({ Component, pageProps }) {
  const [account, setAccount] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState("testnets");
  const testnets = {
    chains: {
      "matic testnet": "Mumbai (Matic Testnet)",
      ropsten: "Ropsten Testnet",
      "bsc testnet": "BSC Testnet",
      "avalanche testnet": "Avalanche Testnet",
    },
  };
  // "rinkeby": "Rinkeby",
  // "goerli": "Goerli",
  // "kovan": "Kovan",

  const mainnets = {
    chains: {
      matic: "Polygon (Matic) Mainnet",
      eth: "Ethereum Mainnet",
      bsc: "BSC Mainnet",
      avalanche: "Avalanche Mainnet",
      fantom: "Fantom Mainnet",
    },
  };

  const networks = currentNetwork === "testnets" ? testnets : mainnets;

  const MORALIS_APP_ID = process.env.NEXT_PUBLIC_MORALIS_APP_ID;
  const MORALIS_SERVER_URL = process.env.NEXT_PUBLIC_MORALIS_SERVER_URL;

  const [error, setError] = useState({
    title: "",
    message: "",
    showErrorBox: false,
  });
  const [success, setSuccess] = useState({
    title: "",
    message: "",
    showSuccessBox: false,
  });

  useEffect(() => {
    console.log("started");
  }, []);

  return (
    <>
      <Script
        src="https://kit.fontawesome.com/0366dd7992.js"
        crossorigin="anonymous"
      ></Script>
      <Script
        src="https://kit.fontawesome.com/5ba82906e9.js"
        crossorigin="anonymous"
      ></Script>
      <MoralisProvider appId={MORALIS_APP_ID} serverUrl={MORALIS_SERVER_URL}>
        <StatusContext.Provider value={[error, success, setSuccess, setError]}>
          <Layout setCurrentNetwork={setCurrentNetwork}>
            <Component
              {...pageProps}
              account={account}
              networks={mainnets}
              setAccount={setAccount}
            />
          </Layout>
        </StatusContext.Provider>
      </MoralisProvider>
    </>
  );
}

export default MyApp;
