import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Button, Form, InputGroup, Accordion, Table } from "react-bootstrap";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { useMoralis, useMoralisCloudFunction } from "react-moralis";
import DeleteModal from "../components/Modal/DeleteModal";
import StatusContext from "../store/status-context";

import TelegramLoginButton from 'react-telegram-login';

const Profile = () => {
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

	const [checkCounter, setCheckCounter] = useState(0);

useEffect(() => {
console.log(user.attributes)
}, [])



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

		return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} | ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
			d.getSeconds()
		)}.${pad(d.getMilliseconds(), 3)}`;
	}

	function getTimestamp(blockTimestamp) {
		var date = new Date(blockTimestamp);
		var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

		return getUTCTimestamp(new Date(now_utc).toUTCString().toString().slice(0, 25));
	}

	const getWatchedAddresses = async () => {
		try {
			const _watched = await Moralis.Cloud.run("getWatchedAddresses");
			setWatchedAddresses("");
			// user feedback
			if (_watched) {
				_watched.map((item) => {
					console.log(item);
					setWatchedAddresses((watchedAddresses) => [...watchedAddresses, item]);
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
					message: "An email is sent to your registered email address. Please verify your email.",
					showSuccessBox: true,
				}));
				
			})
			.catch((error) => {
				// Show the error message somewhere
				alert("Error: " + error.code + " " + error.message);
			});
	};

	const handleTelegramResponse = response => {
  console.log(response);
};

	const Verifytelegram = async () => {
		 fetch('https://api.telegram.org/bot5364673291:AAG-0SnlHvx4ozL5d2APGvTYpQ9-gi-3W-I/getUpdates')
		.then((response) => response.json())
			.then((data) => {
				console.log(data)
				// handleSave();
				console.log(telegram)

				let telegramiddata = data.result.filter(messageBlock => messageBlock.message.chat.username === telegram)
				if (telegramiddata.length === 0) { alert("Your Telegram is Not verified"); } else  {
					console.log(telegramiddata[0].message.chat.id)
					// setchat_id(telegramiddata[0].message.chat.id)
					handleSave(telegramiddata[0].message.chat.id)
				
				}
				
			})
			.catch((error) => {
				// Show the error message somewhere
				alert("Error: " + error.code + " " + error.message);
			});
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
		let chatid = needid.toString()
		if (email === user.attributes.email) {
			console.log("telegram:", telegram === "");
			setUserData({
				telegram: telegram,
				chat_id:chatid,
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
		deleteAddress({
			onSuccess: async (object) => {
				setDeleteModalOpen(false);
				router.reload(window.location.pathname);
			},
			onError: (error) => {
				console.log("deleteAddress Error:", error);
			},
		});
	};

	return (
		<>
			<Head>
				<title>AlertBytes</title>
				<meta name="description" content="AlertBytes" />
			</Head>
			<div className="container">
				<h1 className="text-center mt-4">Hey!</h1>
				<div style={{ textAlign: "center" }} className="wallet_addr">
					<span className={styles.submit_form_resend } type="submit">
						{user && user.attributes.accounts}
					</span>
					<p className="text-black text-center py-3 text-base">Get started with AlertBytes!</p>

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
								{user && email === user.attributes.email && user.attributes.emailVerified ? (
									<div className="d-flex justify-content-center align-items-center">
										<i className="fa-solid fa-circle-check" style={{ fontSize: "25px", color: "green" }}></i>
									</div>
								) : user && email !== user.attributes.email ? (
									<Button className={styles.submit_form_resend} onClick={handleSave}>
										Save
									</Button>
								) : user && !user.attributes.emailVerified ? (
									<Button className={styles.submit_form_resend} onClick={resendVerificationEmail}>
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
									<Button className={styles.submit_form_resend} onClick={Verifytelegram}>
										Save
									</Button>
								) : user && user.attributes.telegram ? (
									<div className="d-flex justify-content-center align-items-center">
										<i className="fa-solid fa-circle-check" style={{ fontSize: "25px", color: "green" }}></i>
									</div>
								) : null}
							</InputGroup>
						</div>
					</div>

					 <TelegramLoginButton dataOnauth={handleTelegramResponse} botName="Crptotesting_bot" />,

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
																<a href={`https://telegram.me/alertbytes_bot`} target="_blank" rel="noopener noreferrer">
									<span>
										Telegram Bot <i className="fa-solid fa-arrow-up-right-from-square"></i>
									</span>
								</a>
							{/* )} */}
							&nbsp;to&#39;begin receiving updates..
						</div>
					</div>
				</form>

				<div style={{ textAlign: "center" }}>
					<h2 className="mt-5">Your Watched Addresses</h2>
					<span className={styles.free_plan}>&apos;You can watch only 2 addresses with a free plan!&apos;</span>
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
															<td>{getTimestamp(item.attributes.createdAt).slice(0, 21)} (UTC)</td>
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
