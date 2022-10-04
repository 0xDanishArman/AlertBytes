import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

export default function AddressAddedModal({ isOpen = "", onClose = "", account = "" }) {
	const [isModalOpen, setIsModalOpen] = useState(isOpen);

	useEffect(() => {
		setIsModalOpen(isModalOpen);
		if (!isModalOpen) {
			document.documentElement.style.overflow = "auto";
		} else {
			document.documentElement.style.overflow = "hidden";
		}
	}, [isModalOpen]);

	useEffect(() => {
		setIsModalOpen(isOpen);
	}, [isOpen]);

	useEffect(() => {
		console.log("isModalOpen:", isModalOpen);
	}, [isModalOpen]);

	const handleChange = () => {
		setIsModalOpen(!isModalOpen);
	};

	const closeModal = () => {
		handleChange();
		onClose();
	};

	return (
		<>
			<Modal show={isModalOpen} onHide={() => closeModal()} aria-labelledby="contained-modal-title-vcenter" centered>
				<Modal.Header>
					<Modal.Title>Address added to watchlist</Modal.Title>
				</Modal.Header>
				<Modal.Body>{account.toLowerCase() + " is added to your watchlist"}</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => closeModal()}>
						Go to Profile
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
