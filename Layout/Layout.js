import { useEffect, useContext } from "react";
import { useMoralis } from "react-moralis";
import Footer from "../components/footer/Footer";
import Header from "../components/header/Header";
import StatusContext from "../store/status-context";
import ErrorBox from "./ErrorBox";
import SuccessBox from "./SuccessBox";

const Layout = ({ children }) => {
	const { authError } = useMoralis();
	const [error, success, setSuccess, setError] = useContext(StatusContext);

	useEffect(() => {
		if (authError) {
			if (
				authError.message !== "Web3Auth: User closed login modal." &&
				authError.message !==
					"Cannot execute Moralis.enableWeb3(), as Moralis Moralis.enableWeb3() already has been called, but is not finished yet " &&
				authError.message !== "MetaMask Message Signature: User denied message signature." &&
				authError.message !== "User closed modal"
			) {
				setError((prevState) => ({
					...prevState,
					title: "Auth failed!",
					message: authError.message,
					showErrorBox: true,
				}));
			}
		}
	}, [authError]);

	return (
		<div>
			<Header />
			<main>{children}</main>
			{error.showErrorBox && <ErrorBox />}
			{success.showSuccessBox && <SuccessBox />}
			<Footer />
		</div>
	);
};

export default Layout;
