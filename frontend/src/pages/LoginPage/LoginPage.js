import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Spin } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useLogin } from "../../contexts/UserContext";

import APIService from "../../APIService";

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
    password: ""
  });
  const [message, setMessage] = useState({
    message: "",
    description: ""
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (status === "login") {
      setLoginInfo(prevState => ({
        ...prevState,
        [name]: value
      }));
    } else {
      setSignupInfo(prevState => ({
        ...prevState,
        [name]: value
      }))
    };
  }


  const handleSignupSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    APIService.registerUser(signupInfo)
      .then(response => {
        setError(false);
        setLoading(false);
        setMessage({
          message: "Sign Up Succesful!",
          description: "Check your email to get your account password."
        });
        setVisible(true);
        setStatus("login");
      })
      .catch(error => {
        setLoading(false);
        setMessage({
          message: "Sign Up Failed!",
          description: "Username or email is taken or invalid."
        });
        setError(true);
        setVisible(true);
      })
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    APIService.loginUser(loginInfo)
      .then(response => {
        setAuthTokens(response);
        // sessionStorage.setItem("token", response.token);
        localStorage.setItem('authTokens', JSON.stringify(response))
        setError(false);
        setTimeout(() => navigate("/"), 2000);
      })
      .catch(error => {
        setLoading(false);
        setMessage({
          message: "Log In Failed!",
          description: "Username or password is invalid."
        });
        setError(true);
        setVisible(true);
      })
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    // setLoading(true);
    // send email
    setMessage({
      message: "Email Sent!",
      description: "Check your email to reset your password."
    });
    setVisible(true);
    setStatus("login");
    // APIService.loginUser(loginInfo)
    //   .then(response => {
    //     setAuthTokens(response);
    //     // sessionStorage.setItem("token", response.token);
    //     localStorage.setItem('authTokens', JSON.stringify(response))
    //     setError(false);
    //     setTimeout(() => navigate("/"), 2000);
    //   })
    //   .catch(error => {
    //     setLoading(false);
    //     setMessage({
    //       message: "Log In Failed!",
    //       description: "Username or password is invalid."
    //     });
    //     setError(true);
    //     setVisible(true);
    //   })
  };

  return (
    <div className="login-page">
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <div className="login-text">
            <img src={adaroLogo} alt="adaro-logo" className="adaro-logo" />
            <h1>BARITO RIVER <br /> WEB APP</h1>
            <div className="supertype-wrapper">
              <p>By</p>
              <img src={supertypeLogo} alt="supertype-logo" className="supertype-logo" />
            </div>
          </div>

          <div className="login-box">
            {status === "login" ? (
              <Form
                name="login-form"
                initialValues={{ remember: true }}
                onSubmitCapture={handleLoginSubmit}
              >
                <p className="form-title">Welcome Back</p>
                {visible ? (
                  <Alert
                    style={{ marginLeft: "auto", marginRight: "auto", marginBottom: "20px", textAlign: "left" }}
                    message={message.message}
                    description={message.description}
                    type={error ? "error" : "success"}
                    showIcon
                    closable
                    afterClose={() => setVisible(false)}
                  />
                ) : null}

                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Please input your username.' }]}
                >
                  <Input
                    size="large"
                    placeholder="Username"
                    prefix={<UserOutlined />}
                    name="username"
                    onChange={handleChange}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Please input your password.' }]}
                  style={{ marginBottom: "5px"}}
                >
                  <Input.Password
                    size="large"
                    placeholder="Password"
                    name="password"
                    prefix={<LockOutlined />}
                    onChange={handleChange}
                  />
                </Form.Item>
                <div style={{textAlign: "end", marginBottom: "10px"}}>
                  <small
                    className="link"
                    onClick={() => {
                      setStatus("forgot-password");
                      setVisible(false);
                    }}
                  >
                    Forgot Password?
                  </small>
                </div>
                <Form.Item>
                  <Button type="primary" htmlType="submit" className="login-form-button">
                    LOGIN
                  </Button>
                </Form.Item>
                <small>
                  <span>Don't have an account? </span>
                  <span className="link" onClick={() => {
                    setStatus("signup");
                    setVisible(false);
                  }}>Signup here</span>
                </small>
              </Form>
            ) : status==="signup" ? (
              <Form
                name="login-form"
                initialValues={{ remember: true }}
                onSubmitCapture={handleSignupSubmit}
              >
                <p className="form-title">Register Your Account</p>
                {visible ? (
                  <Alert
                    style={{ marginLeft: "auto", marginRight: "auto", marginBottom: "20px", textAlign: "left" }}
                    message={message.message}
                    description={message.description}
                    type={error ? "error" : "success"}
                    showIcon
                    closable
                    afterClose={() => setVisible(false)}
                  />
                ) : null}

                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Please input your username.' }]}
                >
                  <Input
                    size="large"
                    placeholder="Username"
                    prefix={<UserOutlined />}
                    name="username"
                    onChange={handleChange}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[{ required: true, message: 'Please input your email.' }]}
                >
                  <Input
                    size="large"
                    placeholder="Email address"
                    prefix={<MailOutlined />}
                    name="email"
                    onChange={handleChange}
                  />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" className="login-form-button">
                    SIGNUP
                  </Button>
                </Form.Item>
                <small>
                  <span>Already have an account? </span>
                  <span className="link" onClick={() => {
                    setStatus("login");
                    setVisible(false);
                  }}>Login here</span>
                </small>
              </Form>
            ) : (
              <Form
                name="login-form"
                initialValues={{ remember: true }}
                onSubmitCapture={handlePasswordSubmit}
              >
                <p className="form-title">Forgot Password</p>
                <p>Enter your email address below, and we'll email instructions on setting a new password.</p>
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: 'Please input your email.' }]}
                >
                  <Input
                    size="large"
                    placeholder="Email address"
                    prefix={<MailOutlined />}
                    name="email"
                    onChange={handleChange}
                  />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" className="login-form-button">
                    SUBMIT
                  </Button>
                </Form.Item>
                <small>
                  <span className="link" onClick={() => {
                    setStatus("login");
                  }}>Back to Login Page</span>
                </small>
              </Form>
            )}
          </div>
        </>
      )}
    </div>
  )
};

export default LoginPage;