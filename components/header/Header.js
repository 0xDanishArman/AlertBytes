import React from "react";
import { useMoralis } from "react-moralis";
import { Button } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/Home.module.css";

async function addPolygonTestnetNetwork() {
	const { ethereum } = window;
	try {
		await ethereum.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: "0x13881" }], // Hexadecimal version of 80001, prefixed with 0x
		});
	} catch (error) {
		if (error.code === 4902) {
			try {
				await ethereum.request({
					method: "wallet_addEthereumChain",
					params: [
						{
							chainId: "0x13881", // Hexadecimal version of 80001, prefixed with 0x
							chainName: "POLYGON Testnet",
							nativeCurrency: {
								name: "MATIC",
								symbol: "MATIC",
								decimals: 18,
							},
							rpcUrls: ["https://matic-mumbai.chainstacklabs.com/"],
							blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
							iconUrls: [""],
						},
					],
				});
			} catch (addError) {
				console.log("Did not add network");
			}
		}
	}
}

const Header = () => {
	const { isAuthenticated, authenticate, logout, user } = useMoralis();
	const router = useRouter();

	const handleLogout = async () => {
		if (router.pathname !== "/") router.push("/", undefined, { shallow: true });
		await logout();
		router.reload(window.location.pathname);
	};

	const metamaskLogin = async () => {
		await addPolygonTestnetNetwork();
		await authenticate({ signingMessage: "AlertBytes Authentication" })
			.then(function (user) {
				// Do something if user is logged in
			})
			.catch(function (error) {
				console.log("Metamask authentication error:", error);
			});
	};

	if (typeof window !== "undefined") {
		const { ethereum } = window;
		if (ethereum)
			ethereum.on("accountsChanged", async (accounts) => {
				if (accounts.length == 0) {
					await logout();
					router.reload(window.location.pathname);
				}
			});
	}

	return (
		<>
			<div className="bg-image-header" style={{ background: "3FFF" }}>
				<div className="container py-4">
					<div className="row justify-content-end">
						<div className="col-md-8">
							<div className={styles.header_logo}>
								{/* <Image src="/Logo.png" alt="me" width="300" height="100" /> */}
								<Link href="/">
									<span className={styles.title_alertbytes}>A product of ImmuneBytes</span>
								</Link>
							</div>
						</div>
						{isAuthenticated && user ? (
							<>
							<div className="phone-header-btn">
								<div className="col-md-3">
									<Link href="/profile" className="ml-4">
										<div className={styles.wallet_button}>
											<Button className={styles.connect_wallet} variant="primary">
												My Profile
											</Button>
										</div>
									</Link>
								</div>
								<div className="col-md-1">
									<div className={styles.wallet_button}>
										<Button onClick={() => handleLogout()} className={styles.connect_wallet} variant="primary">
											Logout
										</Button>
									</div>
								</div>
								</div>
							</>
						) : (
							<div className="col-md-4">
								<div className={styles.wallet_buttons}>
									<Button onClick={() => metamaskLogin()} className={styles.connect_wallet} variant="primary">
										Connect Wallet
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default Header;
