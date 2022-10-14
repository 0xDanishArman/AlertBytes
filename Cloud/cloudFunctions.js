const logger = Moralis.Cloud.getLogger();

Moralis.Cloud.define("watchAddress", async (request) => {
  // Check 1/2: address exists
  if (!request.params.address) {
    logger.info("ERROR: Missing address param");
  } else {
    // -------- CAPTURE PARAMS --------
    let address = request.params.address;
    let name = request.params.name;
    // method of alerting
    let alert_method = request.params.alert_method;
    // conditions to be met
    let conditions = request.params.conditions;
    // user threshold
    let threshold = request.params.threshold;
    // user notes
    let notes = request.params.notes;

    const User = Moralis.Object.extend("User");
    const query = new Moralis.Query(User);
    query.equalTo("objectId", request.user.id);
    const object = await query.first({ useMasterKey: true });
    // user
    let user = object;

    if (!alert_method || !conditions || !threshold) {
      logger.info("ERROR: Missing params");
      return null;
    }

    var countQuery;
    var watchCount;

    // check 2/2: address is not already being watched
    if (request.params.chain === "matic testnet") {
      countQuery = new Moralis.Query("WatchedPolygonAddress");
      countQuery.equalTo("address", address);
      watchCount = await countQuery.count();
    } else if (request.params.chain === "ropsten") {
      countQuery = new Moralis.Query("WatchedEthAddress");
      countQuery.equalTo("address", address);
      watchCount = await countQuery.count();
    } else if (request.params.chain === "bsc testnet") {
      countQuery = new Moralis.Query("WatchedBscAddress");
      countQuery.equalTo("address", address);
      watchCount = await countQuery.count();
    } else if (request.params.chain === "avalanche testnet") {
      countQuery = new Moralis.Query("WatchedAvaxAddress");
      countQuery.equalTo("address", address);
      watchCount = await countQuery.count();
    }

    if (watchCount > 0) {
      // already on watch list, don't sync again
      return null;
    }

    var watched;

    // add address to watch list
    // sync all txs in realtime to WatchedPolygonAddress class
    if (request.params.chain === "matic testnet") {
      await Moralis.Cloud.run(
        "watchPolygonAddress",
        {
          address,
          sync_historical: false,
        },
        { useMasterKey: true }
      );

      const WatchedPolygon = Moralis.Object.extend("WatchedPolygon");
      // Create a new instance of that class.
      watched = new WatchedPolygon();
    } else if (request.params.chain === "ropsten") {
      await Moralis.Cloud.run(
        "watchEthAddress",
        {
          address,
          sync_historical: false,
        },
        { useMasterKey: true }
      );

      const WatchedEth = Moralis.Object.extend("WatchedEth");
      // Create a new instance of that class.
      watched = new WatchedEth();
    } else if (request.params.chain === "bsc testnet") {
      await Moralis.Cloud.run(
        "watchBscAddress",
        {
          address,
          sync_historical: false,
        },
        { useMasterKey: true }
      );

      const WatchedBsc = Moralis.Object.extend("WatchedBsc");
      // Create a new instance of that class.
      watched = new WatchedBsc();
    } else if (request.params.chain === "avalanche testnet") {
      await Moralis.Cloud.run(
        "watchAvaxAddress",
        {
          address,
          sync_historical: false,
        },
        { useMasterKey: true }
      );

      const WatchedAvax = Moralis.Object.extend("WatchedAvax");
      // Create a new instance of that class.
      watched = new WatchedAvax();
    }

    // get row of saved address
    watched.set("address", address);
    watched.set("name", name);
    // set notes for that row
    watched.set("notes", notes);
    // set alert method for that row
    watched.set("alertMethod", alert_method);
    // set conditons for that row
    watched.set("conditions", conditions);
    // set threshold
    watched.set("threshold", threshold);
    // set user
    watched.set("user", user);

    // save row
    try {
      await watched.save();
      logger.info("Address: " + address + " - added to watchlist!");
      return true;
    } catch (err) {
      logger.info("ERROR saving watched:", err);
      return false;
    }
  }
});

var i = 0;

// every time the 'to_address' or 'from_address' of tx is on our watch list, fire alert
Moralis.Cloud.afterSave("PolygonTransactions", async function (request) {
  const confirmed = await request.object.get("confirmed");
  i = i + 1;

  if (!confirmed && i % 2 == 1) {
    logger.info("Txn added now...");
    logger.info("--------- var i = " + i);

    // check address is in watch list
    let to_address = request.object.get("to_address");
    let from_address = request.object.get("from_address");

    // if tx related to watched addresses, fetch meta data
    const watchAddressQuery = new Moralis.Query("WatchedPolygon");
    // address of tx == to_address or from_address
    watchAddressQuery.containedIn("address", [to_address, from_address]);
    watchAddressQuery.select(
      "address",
      "name",
      "alertMethod",
      "conditions",
      "threshold",
      "notes",
      "user.email",
      "user.username",
      "user.chat_id"
    );
    // results = tx data
    let watch_data_entries = await watchAddressQuery.find({
      useMasterKey: true,
    });

    for (let i = 0; i < watch_data_entries.length; i++) {
      const watch_data = watch_data_entries[i];
      // watch_data exist, fire alert with link to block explorer
      if (watch_data) {
        const tx_url =
          "https://mumbai.polygonscan.com/tx/" + request.object.get("hash");
        // alert method
        let _alert_method = watch_data.get("alertMethod");
        // threshold
        let _threshold = watch_data.get("threshold");
        let txn_data = request.object;

        if (txn_data) {
          // if threshold set
          if (_threshold) {
            const priceInUSD = await getPriceInUSD("MATIC-USD");
            const txnAmountInUSD = (
              Number(priceInUSD) *
              Number(parseFloat(txn_data.get("value")) / 10 ** 18)
            ).toFixed(4);
            if (txnAmountInUSD >= parseFloat(_threshold)) {
              // if passed conditions for the saved address, send alert
              if (_alert_method == "telegram") {
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "MATIC-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Telegram MATIC !--------"
                );
              } else if (_alert_method == "email") {
                await sendEmailAlert(watch_data, txn_data, "MATIC-USD", tx_url);
                logger.info("--------! Sent alert message on Email !--------");
              } else if (_alert_method == "both") {
                await sendEmailAlert(watch_data, txn_data, "MATIC-USD", tx_url);
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "MATIC-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Email and telegram !--------"
                );
              }
            }
          }
        } else {
          return false;
        }
      }
    }
  } else {
    logger.info("--------! Not for even var i = " + i);
    return false;
  }
});

Moralis.Cloud.afterSave("BscTransactions", async function (request) {
  const confirmed = await request.object.get("confirmed");
  i = i + 1;

  if (!confirmed && i % 2 == 1) {
    logger.info("Txn added now...");
    logger.info("--------! var i = " + i);

    // check address is in watch list
    let to_address = request.object.get("to_address");
    let from_address = request.object.get("from_address");

    // if tx related to watched addresses, fetch meta data
    const watchAddressQuery = new Moralis.Query("WatchedBsc");
    // address of tx == to_address or from_address
    watchAddressQuery.containedIn("address", [to_address, from_address]);
    watchAddressQuery.select(
      "address",
      "name",
      "alertMethod",
      "conditions",
      "threshold",
      "notes",
      "user.email",
      "user.username",
      "user.chat_id"
    );
    // results = tx data
    let watch_data_entries = await watchAddressQuery.find({
      useMasterKey: true,
    });

    for (let i = 0; i < watch_data_entries.length; i++) {
      logger.info("Started...!");
      const watch_data = watch_data_entries[i];
      // watch_data exist, fire alert with link to block explorer
      if (watch_data) {
        const tx_url =
          "https://testnet.bscscan.com/tx/" + request.object.get("hash");
        // alert method
        let _alert_method = watch_data.get("alertMethod");
        // threshold
        let _threshold = watch_data.get("threshold");
        let txn_data = request.object;
        logger.info("Going...!");
        if (txn_data) {
          // if threshold set
          if (_threshold) {
            logger.info("Working...!");
            const priceInUSD = await getPriceInUSD("BNB-USD");

            const txnAmountInUSD = (
              Number(priceInUSD) *
              Number(parseFloat(txn_data.get("value")) / 10 ** 18)
            ).toFixed(4);
            logger.info("CheckThershold...!");
            if (txnAmountInUSD >= parseFloat(_threshold)) {
              logger.info("Thershold passed for requirment...!");
              // if passed conditions for the saved address, send alert
              if (_alert_method == "telegram") {
                logger.info("Telegram tak...!");
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "BNB-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Telegram BNB !--------"
                );
              } else if (_alert_method == "email") {
                await sendEmailAlert(watch_data, txn_data, "BNB-USD", tx_url);
                logger.info("--------! Sent alert message on Email !--------");
              } else if (_alert_method == "both") {
                await sendEmailAlert(watch_data, txn_data, "BNB-USD", tx_url);
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "BNB-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Email and telegram !--------"
                );
              }
            }
          }
        } else {
          return false;
        }
      }
    }
  } else {
    logger.info("--------! Not for even var i = " + i);
    return false;
  }
});

Moralis.Cloud.afterSave("EthTransactions", async function (request) {
  const confirmed = await request.object.get("confirmed");
  i = i + 1;

  if (!confirmed && i % 2 == 1) {
    logger.info("Txn added now...");
    logger.info("--------! var i = " + i);

    // check address is in watch list
    let to_address = request.object.get("to_address");
    let from_address = request.object.get("from_address");

    // if tx related to watched addresses, fetch meta data
    const watchAddressQuery = new Moralis.Query("WatchedEth");
    // address of tx == to_address or from_address
    watchAddressQuery.containedIn("address", [to_address, from_address]);
    watchAddressQuery.select(
      "address",
      "name",
      "alertMethod",
      "conditions",
      "threshold",
      "notes",
      "user.email",
      "user.username",
      "user.chat_id"
    );
    // results = tx data
    let watch_data_entries = await watchAddressQuery.find({
      useMasterKey: true,
    });

    for (let i = 0; i < watch_data_entries.length; i++) {
      const watch_data = watch_data_entries[i];

      // watch_data exist, fire alert with link to block explorer
      if (watch_data) {
        const tx_url =
          "https://ropsten.etherscan.io/tx/" + request.object.get("hash");
        // alert method
        let _alert_method = watch_data.get("alertMethod");
        // threshold
        let _threshold = watch_data.get("threshold");
        let txn_data = request.object;

        if (txn_data) {
          // if threshold set
          if (_threshold) {
            const priceInUSD = await getPriceInUSD("ETH-USD");
            const txnAmountInUSD = (
              Number(priceInUSD) *
              Number(parseFloat(txn_data.get("value")) / 10 ** 18)
            ).toFixed(4);
            if (txnAmountInUSD >= parseFloat(_threshold)) {
              // if passed conditions for the saved address, send alert
              if (_alert_method == "telegram") {
                logger.error("ETH LOGS" + JSON.stringify(watch_data));
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "ETH-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Telegram ETH !--------"
                );
              } else if (_alert_method == "email") {
                await sendEmailAlert(watch_data, txn_data, "ETH-USD", tx_url);
                logger.info("--------! Sent alert message on Email !--------");
              } else if (_alert_method == "both") {
                await sendEmailAlert(watch_data, txn_data, "ETH-USD", tx_url);
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "ETH-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Email and telegram !--------"
                );
              }
            }
          }
        } else {
          return false;
        }
      }
    }
  } else {
    logger.info("--------! Not for even var i = " + i);
    return false;
  }
});

Moralis.Cloud.afterSave("AvaxTransactions", async function (request) {
  const confirmed = await request.object.get("confirmed");
  i = i + 1;

  if (!confirmed && i % 2 == 1) {
    logger.info("Txn added now...");
    logger.info("--------! var i = " + i);

    // check address is in watch list
    let to_address = request.object.get("to_address");
    let from_address = request.object.get("from_address");

    // if tx related to watched addresses, fetch meta data
    const watchAddressQuery = new Moralis.Query("WatchedAvax");
    // address of tx == to_address or from_address
    watchAddressQuery.containedIn("address", [to_address, from_address]);
    watchAddressQuery.select(
      "address",
      "name",
      "alertMethod",
      "conditions",
      "threshold",
      "notes",
      "user.email",
      "user.username",
      "user.chat_id"
    );
    // results = tx data
    let watch_data_entries = await watchAddressQuery.find({
      useMasterKey: true,
    });

    for (let i = 0; i < watch_data_entries.length; i++) {
      const watch_data = watch_data_entries[i];
      // watch_data exist, fire alert with link to block explorer
      if (watch_data) {
        const tx_url =
          "https://testnet.avascan.info/blockchain/c/tx/" +
          request.object.get("hash");
        // alert method
        let _alert_method = watch_data.get("alertMethod");
        // threshold
        let _threshold = watch_data.get("threshold");
        let txn_data = request.object;

        if (txn_data) {
          // if threshold set
          if (_threshold) {
            const priceInUSD = await getPriceInUSD("AVAX-USD");
            const txnAmountInUSD = (
              Number(priceInUSD) *
              Number(parseFloat(txn_data.get("value")) / 10 ** 18)
            ).toFixed(4);
            if (txnAmountInUSD >= parseFloat(_threshold)) {
              // if passed conditions for the saved address, send alert
              if (_alert_method == "telegram") {
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "AVAX-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Telegram AVAX !--------"
                );
              } else if (_alert_method == "email") {
                await sendEmailAlert(watch_data, txn_data, "AVAX-USD", tx_url);
                logger.info("--------! Sent alert message on Email !--------");
              } else if (_alert_method == "both") {
                await sendEmailAlert(watch_data, txn_data, "AVAX-USD", tx_url);
                await sendTelegramAlert(
                  watch_data,
                  txn_data,
                  "AVAX-USD",
                  tx_url
                );
                logger.info(
                  "--------! Sent alert message on Email and telegram !--------"
                );
              }
            }
          }
        } else {
          return false;
        }
      }
    }
  } else {
    logger.info("--------! Not for even var i = " + i);
    return false;
  }
});

const sendTelegramAlert = async (watch_data, txn_data, tokenPair, tx_url) => {
  const priceInUSD = await getPriceInUSD(tokenPair);
  const _value =
    "$" +
    (Number(priceInUSD) * Number(parseFloat(txn_data.get("value")) / 10 ** 18))
      .toFixed(2)
      .toString();

  let suffix = "";
  let condition = watch_data.get("conditions");
  let notes = watch_data.get("notes");

  logger.info("-------- 🚨 ALERT 🚨--------");
  logger.info("send telegram:" + 1);

  if (
    watch_data.get("address") == txn_data.get("from_address") &&
    condition == "send"
  ) {
    logger.info("send telegram:" + 2);
    suffix = "sent from";
  } else if (
    watch_data.get("address") == txn_data.get("to_address") &&
    condition == "receive"
  ) {
    logger.info("send telegram:" + 3);
    suffix = "received by";
  } else if (condition == "both") {
    logger.info("send telegram:" + 4);
    if (watch_data.get("address") == txn_data.get("from_address")) {
      logger.info("send telegram:" + 5);
      suffix = "sent from";
    } else if (watch_data.get("address") == txn_data.get("to_address")) {
      logger.info("send telegram:" + 6);
      suffix = "received by";
    }
  }
  logger.error("here is the chat id we need " + JSON.stringify(watch_data)); //
  // -------- Telegram creds --------
  const telegram_bot_id = "5364673291:AAG-0SnlHvx4ozL5d2APGvTYpQ9-gi-3W-I"; // <-- ENTER TELEGRAM BOT ID
  const chat_id = watch_data.attributes.user.attributes.chat_id;

  const _msg = _value + " " + suffix + " " + watch_data.get("address");
  // alert message
  let message = "Note: " + notes + "\n\n" + _msg + "\n\n" + tx_url;
  logger.info("**********Telegram_APITHERE_WORKING***********");
  // Moralis httpRequest to Telegram API
  Moralis.Cloud.httpRequest({
    url: "https://api.telegram.org/bot" + telegram_bot_id + "/sendMessage",
    method: "POST",
    crossDomain: true,
    headers: {
      "Content-Type": "application/json",
      "cache-control": "no-cache",
    },
    body: {
      chat_id: chat_id * 1,
      text: message,
    },
  }).then(
    function (httpResponse) {
      logger.info("**********Telegram_PROPERLY_WORKING***********");
      logger.info(httpResponse.text);
    },
    function (httpResponse) {
      logger.info("**********Telegram_BOT_NOT_WORKING***********");
      logger.info("Request failed with response code " + httpResponse.text);
    }
  );

  return;
};

const getPriceInUSD = async (tokenPair) => {
  if (tokenPair == "BNB-USD") {
    return await Moralis.Cloud.httpRequest({
      url: `https://www.binance.com/api/v3/ticker/price?symbol=BNBUSDT`,
    }).then(
      async (httpResponse) => {
        // success
        return httpResponse.data.price;
      },
      function (httpResponse) {
        // error
        logger.info("Request failed with response code " + httpResponse.status);
      }
    );
  } else {
    return await Moralis.Cloud.httpRequest({
      url: `https://api.coinbase.com/v2/prices/${tokenPair}/buy`,
    }).then(
      (httpResponse) => {
        // success
        return httpResponse.data.data.amount;
      },
      function (httpResponse) {
        // error
        logger.info("Request failed with response code " + httpResponse.status);
      }
    );
  }
};

const sendEmailAlert = async (watch_data, txn_data, tokenPair, tx_url) => {
  const priceInUSD = await getPriceInUSD(tokenPair);
  const _value =
    "$" +
    (Number(priceInUSD) * Number(parseFloat(txn_data.get("value")) / 10 ** 18))
      .toFixed(2)
      .toString();

  let suffix = "";
  let condition = watch_data.get("conditions");
  logger.info("send emaillllll:" + 1);

  if (
    watch_data.get("address") == txn_data.get("from_address") &&
    condition == "send"
  ) {
    logger.info("send emaillllll:" + 2);
    suffix = "sent from";
    sendMail(watch_data, _value, suffix, tx_url);
  } else if (
    watch_data.get("address") == txn_data.get("to_address") &&
    condition == "receive"
  ) {
    logger.info("send emaillllll:" + 3);
    suffix = "received by";
    sendMail(watch_data, _value, suffix, tx_url);
  } else if (condition == "both") {
    logger.info("send emaillllll:" + 4);
    if (watch_data.get("address") == txn_data.get("from_address")) {
      logger.info("send emaillllll:" + 5);
      suffix = "sent from";
      sendMail(watch_data, _value, suffix, tx_url);
    } else if (watch_data.get("address") == txn_data.get("to_address")) {
      logger.info("send emaillllll:" + 6);
      suffix = "received by";
      sendMail(watch_data, _value, suffix, tx_url);
    }
  }
  return;
};

const sendMail = async (watch_data, _value, suffix, tx_url) => {
  logger.info(
    "sendMaiiiiiiiillllll to: " + watch_data.attributes.user.attributes.email
  );
  Moralis.Cloud.sendEmail({
    to: watch_data.attributes.user.attributes.email, // <-- ENTER EMAIL ADDRESS HERE
    templateId: "d-eeb89ffdb7234812a15c8e71e1085491", // <-- ENTER SENDGRID TEMPLATE ID HERE
    dynamic_template_data: {
      name: watch_data.attributes.user.attributes.username,
      amount: _value,
      address: watch_data.get("address"),
      note: watch_data.get("notes"),
      link: tx_url,
      suffix: suffix,
    },
  });

  logger.info("-------- 🚨 ALERT Email 🚨--------");
};

Moralis.Cloud.define("getWatchedAddresses", async (request) => {
  const WatchedPolygon = Moralis.Object.extend("WatchedPolygon");
  const query = new Moralis.Query(WatchedPolygon);
  query.select(
    "address",
    "threshold",
    "conditions",
    "notes",
    "alertMethod",
    "name"
  );
  query.equalTo("user", request.user);
  const _dataPolygon = await query.find({ useMasterKey: true });

  const WatchedBsc = Moralis.Object.extend("WatchedBsc");
  const query2 = new Moralis.Query(WatchedBsc);
  query2.select(
    "address",
    "threshold",
    "conditions",
    "notes",
    "alertMethod",
    "name"
  );
  query2.equalTo("user", request.user);
  const _dataBsc = await query2.find({ useMasterKey: true });

  const WatchedEth = Moralis.Object.extend("WatchedEth");
  const query3 = new Moralis.Query(WatchedEth);
  query3.select(
    "address",
    "threshold",
    "conditions",
    "notes",
    "alertMethod",
    "name"
  );
  query3.equalTo("user", request.user);
  const _dataEth = await query3.find({ useMasterKey: true });

  const WatchedAvax = Moralis.Object.extend("WatchedAvax");
  const query4 = new Moralis.Query(WatchedAvax);
  query4.select(
    "address",
    "threshold",
    "conditions",
    "notes",
    "alertMethod",
    "name"
  );
  query4.equalTo("user", request.user);
  const _dataAvax = await query4.find({ useMasterKey: true });

  const _data = [..._dataPolygon, ..._dataBsc, ..._dataEth, ..._dataAvax];

  logger.info("--------! DATA newer !--------" + JSON.stringify(_data));
  logger.info(
    "-------- " + _data.length + " watched Polygon addresses found --------"
  );
  return _data;
});

Moralis.Cloud.define("deleteAddress", async (request) => {
  const query = new Moralis.Query(request.params.itemClassname);
  query.equalTo("objectId", request.params.objectId);
  query.equalTo("user", request.user);
  const object = await query.first({ useMasterKey: true });
  if (object) {
    object.destroy({ useMasterKey: true }).then(
      () => {
        logger.info("The object was deleted successfully.");
      },
      (error) => {
        logger.info(error);
      }
    );
  }
});

Moralis.Cloud.define("checkoldtelegram", async (request) => {
  const query = new Moralis.Query("_User");
  query.equalTo("chat_id", request.params.chatID.toString());
  const obj = await query.first({ useMasterKey: true });
  if (obj) {
    obj.unset("telegram");
    obj.unset("chat_id");
    obj.save(null, { useMasterKey: true }).then(
      (monster) => {
        logger.info("The old telegram was deleted successfully.");
      },
      (error) => {
        logger.info(error);
      }
    );
  }
});
