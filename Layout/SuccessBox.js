import { useContext } from "react";
import StatusContext from "../store/status-context";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

const SuccessBox = () => {
	const [, success, setSuccess] = useContext(StatusContext);
	const handleClose = () => {
		setSuccess((prevState) => ({
			...prevState,
			showSuccessBox: false,
		}));
	};

	return (
		success.showSuccessBox && (
			<ToastContainer className="p-3 position-fixed" position="bottom-end" style={{ zIndex: 10 }}>
				<Toast bg="success" show={success.showErrorBox} onClose={handleClose} delay={5000} autohide>
					<Toast.Header>
						<strong className="me-auto">{success.title}</strong>
					</Toast.Header>
					<Toast.Body className="text-light">{success.message}</Toast.Body>
				</Toast>
			</ToastContainer>
		)
	);
};

export default SuccessBox;
