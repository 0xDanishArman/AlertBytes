import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

export default function DeleteModal({ isOpen = "", onClose = "", deleteWatchedAddress = "" }) {
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
				<Modal.Header closeButton>
					<Modal.Title>Delete Watched Address</Modal.Title>
				</Modal.Header>
				<Modal.Body>Are you sure you want to delete this watched address?</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => closeModal()}>
						Close
					</Button>
					<Button variant="danger" onClick={() => deleteWatchedAddress()}>
						<i className="fa-solid fa-trash text-2xl"></i>
						Delete
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
