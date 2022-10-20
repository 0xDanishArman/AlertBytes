import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Button, Form, InputGroup, Accordion, Table } from "react-bootstrap";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import {
  useMoralis,
  useMoralisCloudFunction,
  useMoralisQuery,
} from "react-moralis";
import DeleteModal from "../components/Modal/DeleteModal";
import StatusContext from "../store/status-context";
import Loader from "../components/loader";

const Profile = () => {
  const [loading, setloading] = useState(false);
  const randomString = () => Math.random().toString(36).substr(2, 9);

  const useStateWithCallbackLazy = (initialValue) => {
    const callbackRef = useRef(null);
    const [state, setState] = useState({
      value: initialValue,
      revision: randomString(),
    });

    /**
     *  useEffect() hook is not called when setState() method is invoked with same value(as the current one)
     *  Hence as a workaround, another state variable is used to manually retrigger the callback
     *  Note: This is useful when your callback is resolving a promise or something and you have to call it after the state update(even if UI stays the same)
     */
    useEffect(() => {
      if (callbackRef.current) {
        callbackRef.current(state.value);

        callbackRef.current = null;
      }
    }, [state.revision, state.value]);

    const setValueWithCallback = useCallback((newValue, callback) => {
      callbackRef.current = callback;

      return setState({
        value: newValue,
        // Note: even if newValue is same as the previous value, this random string will re-trigger useEffect()
        // This is intentional
        revision: randomString(),
      });
    }, []);

    return [state.value, setValueWithCallback];
  };

  const router = useRouter();
  const { user, setUserData, Moralis, refetchUserData } = useMoralis();
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [chat_id, setchat_id] = useState(0);
  const [watchedAddresses, setWatchedAddresses] = useState([]);
  const [error, success, setSuccess, setError] = useContext(StatusContext);

  const [itemToDelete, setItemToDelete] = useState("");
  const [itemClassname, setItemClassname] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showOTPInput, setshowOTPInput] = useState(false);

  const [checkCounter, setCheckCounter] = useState(0);

  const [OTP, setOTP] = useState("");
  const [tempchatid, settempchatid] = useStateWithCallbackLazy(0);
  const [EnteredOTP, setEnteredOTP] = useState(null);
  const generateOTP = (length) => {
    const characters =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const characterCount = characters.length;
    let OTPvalue = "";
    for (let i = 0; i < length; i++) {
      OTPvalue += characters[Math.floor(Math.random() * characterCount)];
    }
    setOTP(OTPvalue);
    return OTPvalue;
  };

  useEffect(() => {
    const checkEmailVerified = setTimeout(async () => {
      setCheckCounter((prev) => prev + 1);
      if (user && !user.attributes.emailVerified) {
        await refetchUserData();
        if (user.attributes.emailVerified) {
          router.reload(window.location.pathname);
        }
      }
    }, 2000);
    return () => clearTimeout(checkEmailVerified);
  }, [checkCounter]);

  useEffect(() => {
    if (user) {
      refetchUserData();
    }
  }, [user, email, telegram]);

  function getUTCTimestamp(blockTimestamp) {
    const pad = (n, s = 2) => `${new Array(s).fill(0)}${n}`.slice(-s);
    const d = new Date(blockTimestamp);

    return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} | ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
      d.getSeconds()
    )}.${pad(d.getMilliseconds(), 3)}`;
  }

  function getTimestamp(blockTimestamp) {
    var date = new Date(blockTimestamp);
    var now_utc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );

    return getUTCTimestamp(
      new Date(now_utc).toUTCString().toString().slice(0, 25)
    );
  }

  const getWatchedAddresses = async () => {
    try {
      const _watched = await Moralis.Cloud.run("getWatchedAddresses");
      setWatchedAddresses("");
      // user feedback
      if (_watched) {
        _watched.map((item) => {
          console.log(item);
          setWatchedAddresses((watchedAddresses) => [
            ...watchedAddresses,
            item,
          ]);
        });
      } else {
        window.alert(JSON.stringify("No watched addresses found"));
      }
      return;
    } catch (error) {
      console.log("ERROR-", error);
    }
  };

  const resendVerificationEmail = async () => {
    await Moralis.User.requestEmailVerification(user.attributes.email)
      .then(() => {
        setSuccess((prevState) => ({
          ...prevState,
          title: "Verification email sent",
          message:
            "An email is sent to your registered email address. Please verify your email.",
          showSuccessBox: true,
        }));
      })
      .catch((error) => {
        // Show the error message somewhere
        alert("Error: " + error.code + " " + error.message);
      });
  };

  const Verifytelegram = async () => {
    await fetch(
      "https://api.telegram.org/bot5364673291:AAG-0SnlHvx4ozL5d2APGvTYpQ9-gi-3W-I/getUpdates"
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // handleSave();
        console.log(telegram);

        let telegramiddata = data.result.filter(
          (messageBlock) =>
            // if (messageBlock.message.chat.username) {
            messageBlock.message.chat.username === telegram
          // }
        );
        console.log(JSON.stringify(telegramiddata), "tele");
        if (telegramiddata.length === 0) {
          alert("Your Telegram Username is Not verified");
        } else {
          settempchatid(telegramiddata[0].message.chat.id, () => {
            VerifyTeleOTP(telegramiddata[0].message.chat.id);
          });
        }
      })
      .catch((error) => {
        // Show the error message somewhere
        alert("Error: " + error.code + " " + error.message);
      });
  };

  const VerifyTeleOTP = async (_chat_id_) => {
    const telegram_bot_id = "5364673291:AAG-0SnlHvx4ozL5d2APGvTYpQ9-gi-3W-I";
    let message =
      "Note: " +
      "This Message is for your Telegram Verification with AlertBytes." +
      "\n\n" +
      generateOTP(6) +
      "\n\n" +
      "Please Don't share your OTP with anyone for security purposes !";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify({ chat_id: _chat_id_ * 1, text: message }),
    };
    fetch(
      "https://api.telegram.org/bot" + telegram_bot_id + "/sendMessage",
      requestOptions
    )
      .then((data) => {
        console.log(_chat_id_ + "and" + OTP);

        setshowOTPInput(true);

        setSuccess((prevState) => ({
          ...prevState,
          title: "Verification OTP sent",
          message:
            "An OTP is sent to your registered Telegram . Please verify your username.",
          showSuccessBox: true,
        }));
      })
      .catch((error) => {
        alert("Error: " + error.code + " " + error.message);
      });
  };

  const televerifiedsuccess = async (_chat_id_) => {
    const telegram_bot_id = "5364673291:AAG-0SnlHvx4ozL5d2APGvTYpQ9-gi-3W-I";
    let successmessage =
      "Note: " +
      "Your Telegram Verification with AlertBytes is Successfully complted and you are logged in !" +
      "\n\n" +
      "From Now on you will be able to recieve updates about your wallet on that same Bot !";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify({ chat_id: _chat_id_ * 1, text: successmessage }),
    };
    fetch(
      "https://api.telegram.org/bot" + telegram_bot_id + "/sendMessage",
      requestOptions
    )
      .then((data) => {
        console.log("telegram verified sent !");
      })
      .catch((error) => {
        alert("Error: " + error.code + " " + error.message);
      });
  };

  const OTPCHECKS = () => {
    if (EnteredOTP === OTP) {
      handleSave(tempchatid);
      televerifiedsuccess(tempchatid);
    } else {
      alert("Error: OTP NOT VERIFIED");
    }
  };

  useEffect(() => {
    if (user) {
      setEmail(user.attributes.email);
      setTelegram(user.attributes.telegram);
    }
  }, [user]);

  useEffect(() => {
    if (user) getWatchedAddresses();
  }, [user]);

  useEffect(() => {
    console.log("watchedAddresses", watchedAddresses);
  }, [watchedAddresses]);

  const handleSave = async (needid) => {
    setshowOTPInput(false);
    setEnteredOTP();
    let chatid = needid.toString();
    if (email === user.attributes.email) {
      console.log("telegram:", telegram === "");
      setUserData({
        telegram: telegram,
        chat_id: chatid,
      });
      setSuccess((prevState) => ({
        ...prevState,
        title: "Profile updated",
        message: "Your Telegram username was updated successfully!",
        showSuccessBox: true,
      }));
      return;
    } else {
      setUserData({
        email: email === "" ? undefined : email,
        telegram: telegram === "" ? undefined : telegram,
        chat_id: chatid === "" ? undefined : chatid,
      });
      setSuccess((prevState) => ({
        ...prevState,
        title: "Profile updated",
        message: "Your profile was updated successfully!",
        showSuccessBox: true,
      }));
    }
    await refetchUserData();
  };

  const { fetch: deleteAddress } = useMoralisCloudFunction(
    "deleteAddress",
    { objectId: itemToDelete, itemClassname: itemClassname },
    {
      autoFetch: false,
    }
  );
  const deleteWatchedAddress = () => {
    setloading(true);
    deleteAddress({
      onSuccess: async (object) => {
        setDeleteModalOpen(false);
        setloading(false);
        router.reload(window.location.pathname);
      },
      onError: (error) => {
        setloading(false);
        console.log("deleteAddress Error:", error);
      },
    });
  };

  useEffect(() => {
    if (tempchatid != 0) {
      console.log("chat id hit");
      CheckTeleuser();
    }
  }, [tempchatid]);

  const { fetch: checktelegrams } = useMoralisCloudFunction(
    "checkoldtelegram",
    { chatID: tempchatid },
    {
      autoFetch: false,
    }
  );

  const CheckTeleuser = async () => {
    console.log(tempchatid, "this is our returned id");
    if (tempchatid === 0) {
      console.log("temp id is 0 man");
    } else {
      console.log(tempchatid + "This is our chaty");
      checktelegrams({
        onSuccess: async (object) => {
          console.log("Telegram Checked");
        },
        onError: (error) => {
          console.log("checktelegram Error:", error);
        },
      });
    }
  };

  return (
    <>
      <Head>
        <title>AlertBytes</title>
        <meta name="description" content="AlertBytes" />
      </Head>
      <div className="container">
        <Loader loading={loading} />
        <h1 className="text-center mt-4">Hey!</h1>
        <div style={{ textAlign: "center" }} className="wallet_addr">
          <span className={styles.submit_form_resend} type="submit">
            {user && user.attributes.accounts}
          </span>
          <p className="text-black text-center py-3 text-base">
            Get started with AlertBytes!
          </p>
        </div>

        <form>
          <div className="mt-5" style={{ margin: "0 10%" }}>
            <span className="mt-1label-text">Email</span>
            <div className={styles.address_dropdown}>
              <InputGroup>
                <Form.Control
                  placeholder="Enter you email address"
                  type="email"
                  className="email-v"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="email"
                />
                {user &&
                email === user.attributes.email &&
                user.attributes.emailVerified ? (
                  <div className="d-flex justify-content-center align-items-center">
                    <i
                      className="fa-solid fa-circle-check"
                      style={{ fontSize: "25px", color: "green" }}
                    ></i>
                  </div>
                ) : user && email !== user.attributes.email ? (
                  <Button
                    className={styles.submit_form_resend}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                ) : user && !user.attributes.emailVerified ? (
                  <Button
                    className={styles.submit_form_resend}
                    onClick={resendVerificationEmail}
                  >
                    Resend Verification
                  </Button>
                ) : null}
              </InputGroup>
            </div>
          </div>

          <div className="mt-2" style={{ margin: "0 10%" }}>
            <span className="mt-1label-text">Telegram</span>
            <div className={styles.address_dropdown}>
              <InputGroup>
                <Form.Control
                  placeholder="Enter your Telegram Username"
                  type="text"
                  className="telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  id="telegram"
                />

                {user && telegram !== user.attributes.telegram ? (
                  <Button
                    className={styles.submit_form_resend}
                    onClick={Verifytelegram}
                  >
                    Save
                  </Button>
                ) : user && user.attributes.telegram ? (
                  <div className="d-flex justify-content-center align-items-center">
                    <i
                      className="fa-solid fa-circle-check"
                      style={{ fontSize: "25px", color: "green" }}
                    ></i>
                  </div>
                ) : null}
              </InputGroup>
            </div>
          </div>

          {showOTPInput ? (
            <div className="mt-2" style={{ margin: "0 10%" }}>
              <span className="mt-1label-text">OTP VERIFY</span>
              <div className={styles.address_dropdown}>
                <InputGroup>
                  <Form.Control
                    placeholder="Enter your OTP"
                    type="text"
                    className="OTP"
                    value={EnteredOTP}
                    onChange={(e) => setEnteredOTP(e.target.value)}
                    id="otp"
                  />

                  {EnteredOTP ? (
                    <Button
                      className={styles.submit_form_resend}
                      onClick={OTPCHECKS}
                    >
                      Verify
                    </Button>
                  ) : null}
                </InputGroup>
              </div>
            </div>
          ) : null}

          <div className="mt-2" style={{ margin: "0 10%" }}>
            <div className="bot-box">
              Message our&nbsp;
              {/* {user && user.attributes.telegram ? (
								<a
									href="#"
									onClick={() =>
										setSuccess((prevState) => ({
											...prevState,
											title: "Telegram Verified",
											message: "Your Telegram username is already registered.",
											showSuccessBox: true,
										}))
									}
								>
									<span>
										Telegram Bot <i className="fa-solid fa-arrow-up-right-from-square"></i>
									</span>
								</a>

							) : ( */}
              <a
                href={`https://telegram.me/alertbytes_bot`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  Telegram Bot{" "}
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </span>
              </a>
              {/* )} */}
              &nbsp;to&#39;begin receiving updates..
            </div>
          </div>
        </form>

        <div style={{ textAlign: "center" }}>
          <h2 className="mt-5">Your Watched Addresses</h2>
          <span className={styles.free_plan}>
            &apos;You can watch only 2 addresses with a free plan!&apos;
          </span>
        </div>

        {watchedAddresses.length !== 0 ? (
          <>
            {watchedAddresses.map((item, index) => (
              <div key={index} className="col-md-8 offset-md-2 mt-3">
                <div className="acc-1">
                  <Accordion defaultActiveKey="1">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header b>
                        <div className="half">
                          <div className="a-title">Address</div>
                          <div className="a-value">
                            {item.attributes.address.substring(0, 10)}
                            <span>...</span>
                            {item.attributes.address.substring(32, 42)}
                          </div>
                        </div>
                        <div className="half">
                          <div className="a-title">Name</div>
                          <div className="a-value">{item.attributes.name}</div>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Table size="sm">
                          <tbody>
                            <tr>
                              <td>Created</td>
                              <td>
                                {getTimestamp(item.attributes.createdAt).slice(
                                  0,
                                  21
                                )}{" "}
                                (UTC)
                              </td>
                            </tr>
                            <tr>
                              <td>Network</td>
                              <td>
                                {item.className === "WatchedPolygon"
                                  ? "Polygon"
                                  : item.className === "WatchedBsc"
                                  ? "BSC"
                                  : item.className === "WatchedEth"
                                  ? "ETH"
                                  : item.className === "WatchedAvax"
                                  ? "AVAX"
                                  : item.className === "WatchedFtm"
                                  ? "FTM"
                                  : null}
                              </td>
                            </tr>
                            <tr>
                              <td>Alert Method</td>
                              <td>{item.attributes.alertMethod}</td>
                            </tr>
                            <tr>
                              <td>Condition</td>
                              <td>{item.attributes.conditions}</td>
                            </tr>
                            <tr>
                              <td>Threshold</td>
                              <td>$ {item.attributes.threshold}</td>
                            </tr>
                            <tr>
                              <td>Note</td>
                              <td colSpan={2}>{item.attributes.notes}</td>
                            </tr>
                          </tbody>

                          <Button
                            onClick={() => {
                              setDeleteModalOpen(true);
                              setItemToDelete(item.id);
                              setItemClassname(item.className);
                            }}
                            className={styles.acc_edit_button}
                            style={{ marginTop: "7%" }}
                          >
                            Delete
                          </Button>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
        }}
        deleteWatchedAddress={deleteWatchedAddress}
      />
    </>
  );
};

export default Profile;
