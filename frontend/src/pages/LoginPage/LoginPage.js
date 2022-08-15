import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useLogin } from "../../contexts/UserContext";

import APIService from "../../APIService";
import ResetPassword from "../../components/login-page/ResetPassword";
import InputToken from "../../components/login-page/InputToken";
import Login from "../../components/login-page/Login";
import Register from "../../components/login-page/Register";

import adaroLogo from "../../images/adaro-logo.png";
import supertypeLogo from "../../images/supertype.png";

import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthTokens } = useLogin();

  const [status, setStatus] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const [signupInfo, setSignupInfo] = useState({
    username: "",
    email: "",
  });
  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState({
    message: "",
    description: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (status === "login") {
      setLoginInfo((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else if (status === "signup") {
      setSignupInfo((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    APIService.registerUser(signupInfo)
      .then((response) => {
        setError(false);
        setLoading(false);
        setMessage({
          message: "Sign Up Succesful!",
          description: "Check your email to get your account password.",
        });
        setVisible(true);
        setStatus("login");
      })
      .catch((error) => {
        setLoading(false);
        setMessage({
          message: "Sign Up Failed!",
          description: "Username or email is taken or invalid.",
        });
        setError(true);
        setVisible(true);
      });
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    APIService.loginUser(loginInfo)
      .then((response) => {
        setAuthTokens(response);
        // sessionStorage.setItem("token", response.token);
        localStorage.setItem("authTokens", JSON.stringify(response));
        setError(false);
        setTimeout(() => navigate("/"), 2000);
      })
      .catch((error) => {
        setLoading(false);
        setMessage({
          message: "Log In Failed!",
          description: "Username or password is invalid.",
        });
        setError(true);
        setVisible(true);
      });
  };

  return (
    <div className="login-page">
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <div className="login-text">
            <img src={adaroLogo} alt="adaro-logo" className="adaro-logo" />
            <h1>
              BARITO RIVER <br /> WEB APP
            </h1>
            <div className="supertype-wrapper">
              <p>By</p>
              <img
                src={supertypeLogo}
                alt="supertype-logo"
                className="supertype-logo"
              />
            </div>
          </div>

          <div className="login-box">
            {status === "login" ? (
              <Login
                handleLoginSubmit={handleLoginSubmit}
                visible={visible}
                message={message}
                error={error}
                setVisible={setVisible}
                handleChange={handleChange}
                setStatus={setStatus}
              />
            ) : status === "signup" ? (
              <Register
                handleSignupSubmit={handleSignupSubmit}
                visible={visible}
                setVisible={setVisible}
                message={message}
                error={error}
                handleChange={handleChange}
                setStatus={setStatus}
              />
            ) : status === "reset-password" ? (
              <ResetPassword
                setMessage={setMessage}
                visible={null}
                setVisible={setVisible}
                message={message}
                setStatus={setStatus}
                error={null}
                setError={setError}
                setLoading={setLoading}
              />
            ) : status === "reset-password-failed" ? (
              <ResetPassword
                setMessage={setMessage}
                visible={visible}
                setVisible={setVisible}
                message={message}
                setStatus={setStatus}
                error={error}
                setError={setError}
                setLoading={setLoading}
              />
            ) : (
              <InputToken
                visible={visible}
                setVisible={setVisible}
                message={message}
                setMessage={setMessage}
                setStatus={setStatus}
                error={error}
                setError={setError}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LoginPage;
