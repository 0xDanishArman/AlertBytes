# AlertBytes

### About

Aim: Allow user to track wallet addresses, cross-chain (ETH/BSC/MATIC/…) and recieve alerts when specific transaction conditions are met.

### Quick Launch 🚀

Via terminal, navigate to root directory:

```sh
npm install
```

Go to [Moralis.io](https://moralis.io/) to create your server instance.
In the root directory of your code base create a `.env` file containing the moralis servers' enviroment variables:

```sh
REACT_APP_MORALIS_APPLICATION_ID=xxx
REACT_APP_MORALIS_SERVER_URL=https://xxx.bigmoralis.com:2053/server
```

Install Moralis admin client:

```sh
npm install -g moralis-admin-cli
```

This will allow you to sync Moralis Cloud Functions in the [CloudFile](Cloud/cloudFunctions.js):

```sh
moralis-admin-cli watch-cloud-file --moralisApiKey xxx --moralisApiSecret xxx --moralisSubdomain xxx.moralisweb3.com --autoSave 1 --moralisCloudfolder /xxx/watch-wallet-address/Cloud
```

Finally provide your path to the [CloudFile](Cloud/cloudFunctions.js) and sync with Moralis server instance:

```sh
/xxx/watch-wallet-address/Cloud/cloudFunctions.js
```

Once installed and synced with your Moralis server instance, in the project directory run:

```sh
npm run dev
```

### Dependencies 🏗

`Moralis`: [Docs](https://docs.moralis.io/)

`react`, `react-dom` `react-moralis` should be installed automatically ([package.json](./package.json)).

`Tailwind CSS`

### Adapt Alert Conditons 🛠

Cloud function `run` on `watchEthAddress` adds `address` to your list of addresses to track transactions on.

```javascript
// sync all txns in realtime to WatchedEthAddress class
Moralis.Cloud.run("watchEthAddress", {
  address,
  …
});
```

Function `afterSave` on `EthTransactions` then is where you create conditons against those transactions to intiate alerts.

```javascript
 Moralis.Cloud.afterSave("EthTransactions", async function (request) {
    …
 }
```

## Moralis Cloud Functions

-   Command to run on the terminal to watch the changes

`moralis-admin-cli watch-cloud-folder --moralisApiKey F9lCFBQWFq690B5 --moralisApiSecret wOesxvSOxNCArXn --moralisSubdomain ptkbxuowdjvc.usemoralis.com --autoSave 1 --moralisCloudfolder /Users/pushpitbhardwaj/Downloads/Docs_and_Certificates/Internships/Ongoing/ImmuneBytes/work/AlertBytes/alertbytes/Cloud`

Get logs on local terminal-

`moralis-admin-cli get-logs --moralisApiKey F9lCFBQWFq690B5 --moralisApiSecret wOesxvSOxNCArXn`
