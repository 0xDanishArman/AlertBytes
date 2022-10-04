import { useContext } from "react";
import StatusContext from "../store/status-context";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

const ErrorBox = () => {
	const [error, , , setError] = useContext(StatusContext);

	if (error.message == "Cannot execute Moralis.enableWeb3(), as Moralis Moralis.enableWeb3() already has been called, but is not finished yet ") {
		window.location.reload();
	}

	const handleClose = () => {
		setError((prevState) => ({
			...prevState,
			showErrorBox: false,
		}));

		if (error.message == "Cannot execute Moralis.enableWeb3(), as Moralis Moralis.enableWeb3() already has been called, but is not finished yet ") {
			window.location.reload();
		}
	};

	return (
		error.showErrorBox && (
			<ToastContainer className="p-3 position-fixed" position="bottom-end" style={{ zIndex: 10 }}>
				<Toast bg="danger" show={error.showErrorBox} onClose={handleClose} delay={5000} autohide>
					<Toast.Header>
						<strong className="me-auto">{error.title}</strong>
					</Toast.Header>
					<Toast.Body className="text-light">{error.message}</Toast.Body>
				</Toast>
			</ToastContainer>
		)
	);
};

export default ErrorBox;
