import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Button, Dropdown, Form, InputGroup } from "react-bootstrap";
import Image from "next/image";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { useMoralis } from "react-moralis";
import StatusContext from "../store/status-context";
import AddressAddedModal from "../components/Modal/AddressAddedModal";

const Home = ({ account, setAccount, networks }) => {
	const { Moralis, user, isAuthenticated } = useMoralis();
	const { authenticate,isInitialized } = useMoralis();
	const router = useRouter();
	const [error, success, setSuccess, setError] = useContext(StatusContext);

	const [email, setEmail] = useState("");
	const [telegram, setTelegram] = useState("");
	const [alertOption, setAlertOption] = useState("email");
	const [chain, setChain] = useState("matic testnet");
	const [threshold, setThreshold] = useState("");
	const [addressAddedModalOpen, setAddressAddedModalOpen] = useState(false);

	const [maticUSD, setMaticUSD] = useState("");


	if(isInitialized){console.log("is done with the initializzarion")}

	function chainChanged(event) {
		setChain(event);
	}

	const handleRadioChange = (e) => {
		setAlertOption(e.target.value);
	};

	function accountChanged(event) {
		setAccount(event.target.value.toLowerCase());
	}

	useEffect(() => {
		if (isAuthenticated) {
			setEmail(user.attributes.email);
			setTelegram(user.attributes.telegram);
		}
	}, [isAuthenticated, user]);

	async function fetchMaticUSD() {
		const COINBASE_BASE_URL = "https://api.coinbase.com/v2";
		const res = await fetch(`${COINBASE_BASE_URL}/prices/MATIC-USD/buy`);
		const result = await res.json();
		setMaticUSD(((1 / result.data.amount) * Number(threshold)).toFixed(2));
	}

	let truncatedmaticUSDPrice = maticUSD;
	if (maticUSD >= 1000000) {
		truncatedmaticUSDPrice = Number((maticUSD / 1000000).toFixed(2)) + " M";
	} else if (maticUSD >= 1000) {
		truncatedmaticUSDPrice = Number((maticUSD / 1000).toFixed(2)) + " K";
	}

	useEffect(() => {
		fetchMaticUSD();
	}, [threshold]);

	useEffect(() => {
	console.log("started") 
	}, [])

	const onSubmit = async () => {
		if (!isAuthenticated) {
			setError((prevState) => ({
				...prevState,
				title: "Signup/Login required",
				message: "You must be signed in to add an address to your watchlist",
				showErrorBox: true,
			}));
			return;
		} else {
			try {
				let selected_alert_method = document.querySelector('input[name="AlertOption"]:checked').value;
				let condition = document.getElementById("condition").value;
				let threshold = document.getElementById("threshold").value;
				let note = document.getElementById("note").value;
				let name = document.getElementById("name").value;

				if (selected_alert_method == "telegram" && !user.attributes.telegram) {
					setError((prevState) => ({
						...prevState,
						title: "Telegram username not provided",
						message: "You must set up your Telegram username in your Profile page in order to proceed.",
						showErrorBox: true,
					}));
					return;
				} else if (selected_alert_method == "email" && (!user.attributes.email || !user.attributes.emailVerified)) {
					setError((prevState) => ({
						...prevState,
						title: "Email not provided and/or verified",
						message: "You must set up your email in your Profile page in order to proceed.",
						showErrorBox: true,
					}));
					return;
				} else if (selected_alert_method == "both" && (!user.attributes.email || !user.attributes.emailVerified || !user.attributes.telegram)) {
					setError((prevState) => ({
						...prevState,
						title: "Email/Telegram not set up",
						message: "You must set up your email/telegram in your Profile page in order to proceed.",
						showErrorBox: true,
					}));
					console.log("kngaksn");
					return;
				}

				// capture address
				const params = {
					name: name,
					address: account.toLowerCase(),
					alert_method: selected_alert_method,
					conditions: condition,
					threshold: threshold,
					notes: note,
					chain: chain,
				};

				const _watched = await Moralis.Cloud.run("getWatchedAddresses");
				console.log(_watched);
				if (_watched.length > 1) {
					window.alert("You've exceeded the limit on the free plan. Please upgrade to a paid plan to add more addresses.");
					return;
				}

				const watch = await Moralis.Cloud.run("watchAddress", params);
				// user feedback
				if (watch) {
					setAddressAddedModalOpen(true);
					setEmail("");
					setTelegram("");
					setAlertOption("email");
					setThreshold("");
					document.getElementById("address").value = "";
					document.getElementById("note").value = "";
					document.getElementById("name").value = "";
				} else {
					window.alert(JSON.stringify("🚫 You're already watching this address 🚫", 0, 2));
				}
			} catch (error) {
				console.log(error);
			}
		}
	};

	return (
		<>
			<Head>
				<title>AlertBytes</title>
				<meta name="description" content="AlertBytes" />
			</Head>
			<div className="bg-image">
				<div className="container">
					<form
						onSubmit={(event) => {
							event.preventDefault();
							onSubmit();
						}}
					>
						<div>
							<div style={{ textAlign: "center" }}>
								<Image src="/Logo.png" alt="me" width="700" height="200" />
							</div>
							<p className={styles.title_alertbytes_para} style={{fontWeight:'600'}}>Monitoring your Wallet/Smart Contract getting difficult?</p>
							<p className={styles.title_alertbytes_para_sec}>Subscribe to AlertBytes for instant notifications anytime your Wallet/Smart Contract triggers an event.</p>
						</div>

						<div className={styles.address_dropdown} >
							<input
								type="text"
								name="address"
								id="address"
								placeholder="Enter Wallet/Smart Contract Address to look for"
								onChange={accountChanged}
								required
								className="form-control address"
							/>
							<div className="input-group-append">
								<Dropdown id="blockchain" name="blockchain" onSelect={(e) => chainChanged(e)}>
									<Dropdown.Toggle className="btn-defaults">{networks.chains[chain]}</Dropdown.Toggle>
									<Dropdown.Menu>
										{Object.keys(networks.chains).map((chain) => (
											<Dropdown.Item eventKey={chain} data-chainlookupvalue={chain} key={chain}>
												{networks.chains[chain]}
											</Dropdown.Item>
										))}
									</Dropdown.Menu>
								</Dropdown>
							</div>
						</div>

						<div className={styles.address_input} style={{  }}>
							<input type="text" id="name" className="form-control address" placeholder="Give a name to your address" />
						</div>

						<div className={styles.condition_box_alert}>
							<div className="row">
								<div className="col-md-5">
									<h2 className={styles.title_alertmethod}>Alert method:</h2>
									<p className={styles.title_alertmethod_para}>Choose the medium of notification.  </p>
								</div>
								<div className="col-md-7 responsive-alert">
									<div className="row mt-4">
										<div className="col-md-4">
											<label htmlFor="AlertOption-0">
												<input
													type="radio"
													name="AlertOption"
													id="AlertOption-0"
													value="telegram"
													checked={alertOption === "telegram"}
													onChange={handleRadioChange}
													required
												/>
												<span>&nbsp;&nbsp;Telegram</span>
											</label>
										</div>
										<div className="col-md-4">
											<label htmlFor="AlertOption-1">
												<input
													type="radio"
													name="AlertOption"
													id="AlertOption-1"
													value="email"
													checked={alertOption === "email"}
													onChange={handleRadioChange}
													required
												/>
												<span>&nbsp;&nbsp;Email</span>
											</label>
										</div>
										<div className="col-md-4">
											<label htmlFor="AlertOption-2">
												<input
													type="radio"
													name="AlertOption"
													id="AlertOption-2"
													value="both"
													checked={alertOption === "both"}
													onChange={handleRadioChange}
													required
												/>
												<span>&nbsp;&nbsp;Both</span>
											</label>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className={styles.condition_box}>
							<div className="row">
								<div className="col-md-6">
									<div className="">
										<h2 className={styles.title_alertmethod}>Conditions:</h2>
										<p className={styles.title_alertmethod_para}>Set conditions to receive alerts. </p>
									</div>
								</div>
								<div className="col-md-6" style={{marginTop:"2%"}}>
									<div className={styles.alert_dropdown}>
										<Form.Select id="condition">
											<option name="conditions" value="send">
												⬆ Send
											</option>
											<option name="conditions" value="receive">
												⬇ Receive
											</option>
											<option name="conditions" value="both">
												Both
											</option>
										</Form.Select>
									</div>
								</div>
							</div>
						</div>

						<div className={styles.condition_box}>
							<div className="row">
								<div className="col-md-6">
									<div className="relative">
										<h2 className={styles.title_alertmethod}>Threshold Price ($)</h2>
										{/* <p className={styles.title_alertmethod_para}>(approx. {truncatedmaticUSDPrice} MATIC)</p> */}
										<p className={styles.title_alertmethod_para}>Lay the minimum limits to trigger alerts. </p>
									</div>
								</div>
								<div className="col-md-6" style={{marginTop:"2%"}}>
									<InputGroup className="relative">
										<Form.Control
											type="number"
											id="threshold"
											value={threshold}
											onChange={(e) => setThreshold(e.target.value)}
											placeholder="Enter price threshold in USD"
											step="0.001"
											className="tprice"
											min="0"
											required
										/>
									</InputGroup>
								</div>
							</div>
						</div>

						<div className={styles.condition_box}>
							<div className="row">
								<div className="col-md-6">
									<div className="">
										<h2 className={styles.title_alertmethod}>Note:</h2>
										<p className={styles.title_alertmethod_para}>Let us know what your alerts should say.</p>
									</div>
								</div>
								<div className="col-md-6">
									<div className={styles.note_filed}>
										<Form.Control
											as="textarea"
											id="note"
											rows="3"
											placeholder="Eg. Binance MATIC Whale Alert"
											style={{ height: "100px" }}
										/>
										{/* <textarea id="note" rows="3" placeholder="Eg. Binance MATIC Whale Alert"></textarea> */}
									</div>
								</div>
							</div>
						</div>

						<div className={styles.submit_button} style={{ margingBottom: "100px" }}>
							<Button className={styles.submit_form_button} type="submit">
								Submit
							</Button>
						</div>
					</form>
				</div>
			</div>
			<AddressAddedModal
				isOpen={addressAddedModalOpen}
				onClose={() => {
					setAddressAddedModalOpen(false);
					router.replace("/profile");
				}}
				account={account}
			/>
		</>
	);
};

export default Home;
