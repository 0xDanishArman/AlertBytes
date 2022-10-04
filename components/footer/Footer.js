import { useState } from "react";
import { FaTelegram, FaDiscord, FaTelegramPlane } from "react-icons/fa/";
import { FaRedditAlien } from "react-icons/fa";
import { ImTwitter } from "react-icons/im";
import styles from "../../styles/Home.module.css";
import { Button, Form, InputGroup } from "react-bootstrap/";
import Image from "next/image";

const Footer = () => {
	const [email, setEmail] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
		  const res = await fetch("https://0xbugbytes.azurewebsites.net/newsletter", {
			method: "POST",
			body: JSON.stringify({
			  email: email,
			}),
		});
		console.log(res,'log');
		  const resJson = await res.json();
		  if (res.status === 200) {
			setEmail("");
			setMessage("User created successfully");
		  } else {
			setMessage("Some error occured");
		  }
		} catch (err) {
		  console.log(err);
		}
	  };
	return (
		<>
			<div className="container"></div>
			<footer>
				<div className=" container pb-1">
				<div className={styles.cta_box}>
					<div className="row">
						<div className="col-md-8">
							<p className="footer-text-top">
							Subscribe to our newsletter for AlertBytes development updates.
							</p>
						</div>
						<div className="col-md-4 button-res" style={{marginLeft:'0px'}}>	
							<Form className="input-form"  onSubmit={handleSubmit}>
								<InputGroup className="group-input">
									<Form.Control className="board"
										placeholder='Email'
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										/>
									<div className={styles.cta_button}>
									<Button className={styles.submit_form_button} type="submit">
										Submit
									</Button>
									</div>
								</InputGroup>
							</Form>

						</div>
					</div>
				</div>
					{/* <div className={styles.cta_box}>
						<div className={styles.cta_para}>
							<p className="pt-2">In publishing and graphic design, Lorem ipsum is a placeholder</p>
						</div>
						<div className={styles.cta_button}>
							<Button className={styles.submit_form_button} type="submit">
								Submit
							</Button>
						</div>
					</div> */}
					<h1 className="join-community">JOIN OUR COMMUNITY</h1>
					<div className="row icon-row">
						<div className="col-md-3 offset-md-4">
							<div className="row">
								<div className="col-md-12 main-box box-color">
									<p className="link-footer" href="https://t.me/immunebytes" target="_blank" rel="noreferrer">
										{/* <div className="icon-box telegrambg">
											<div className="icon-only">
												<FaTelegramPlane className="fa fa-2x" color="#269fde" />
											</div>
											<div className="text-only">
												<span>TELEGRAM</span>
												
											</div>
										</div> */}
									</p>
									<a className="link-footer" href="https://t.me/immunebytes" target="_blank" rel="noreferrer">
										<div className="icon-box telegrambg">
											<div className="icon-only">
												<FaTelegramPlane className="fa fa-2x" color="#269fde" />
											</div>
											{/* <div className="text-only">
												<span>TELEGRAM</span>
												
											</div> */}
										</div>
									</a>
									<a className="link-footer" href="https://twitter.com/ImmuneBytes" target="_blank" rel="noreferrer">
										<div className="icon-box twitter">
											<div className="icon-only">
												<ImTwitter className="fa fa-2x" color="#7ac4f7" />
											</div>
											{/* <div className="text-only">
												<span>TWITTER</span>
												
											</div> */}
										</div>
									</a>
									<p className="link-footer" href="" target="_blank" rel="noreferrer">
										{/* <div className="icon-box discord">
											<div className="icon-only">
												<FaDiscord className="fa fa-2x" color="#5666ef" />
											</div>
											<div className="text-only">
												<span>DISCORD</span>
												
											</div>
										</div> */}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="brand-logo-footer">
					<p className="powered">Powered By</p>
					<Image src="/brand-logo.png" alt="me" width="110" height="100" />
				</div>
				<h1 className="footer-underline"></h1>
				<p className="footer-title">© 2021 ImmuneBytes. All Rights Reserved.</p>
			</footer>
		</>
	);
};

export default Footer;
