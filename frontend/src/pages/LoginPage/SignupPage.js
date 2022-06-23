import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Spin } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

import APIService from "../../APIService";

import adaroLogo from "../../images/adaro-logo.png";
import supertypeLogo from "../../images/supertype.png";

import "./LoginPage.css";


const SignupPage = () => {

  const [signupInfo, setSignupInfo] = useState({
    username:"",
    email:"", 
    password:""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [finish, setFinish] = useState(false);
  const [error, setError] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSignupInfo(prevState => ({
      ...prevState,
      [name] : value
    }));
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    APIService.registerUser(signupInfo)
      .then(response => {
        setError(false);
        setLoading(false);
        setMessage("Sign up successful!");
        setFinish(true);
      })
      .catch(error => {
        setLoading(false);
        setMessage("Sign up failed.");
        setFinish(true);
        setError(true);
      })
    };
  
  useEffect(() => {
    if(message === "Sign up successful!" ){
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [loading, message])

  return(
      <div className="login-page">
      {
        loading ? (
          <Spin />
        ) : (
          <>
          <div className="login-text">
            <img src={ adaroLogo } alt="adaro-logo" className="adaro-logo"/>
            <h1>BARITO RIVER <br/> WEB APP</h1>
            <div className="supertype-wrapper">
              <p>By</p>
              <img src={ supertypeLogo } alt="supertype-logo" className="supertype-logo"/>
            </div>
          </div>
    
          <div className="login-box">
            { finish ? (
              <Alert message={ message } type={ error ? "error" : "success" } showIcon />
            ) : (
              <></>
            )}
              <Form
                name="login-form"
                initialValues={{ remember: true }}
                onSubmitCapture = { handleSubmit }
              >
                <p className="form-title">Register Your Account</p>
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Please input your username.' }]}
                >
                  <Input
                    size="large"
                    placeholder="Username"
                    prefix={<UserOutlined />}
                    name ="username"
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
    
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Please input your password.' }]}
                >
                  <Input.Password 
                    size="large"
                    placeholder="Password"
                    prefix={<LockOutlined />}
                    name="password"
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
                  <Link to="/login">Login here</Link>
                </small>
              </Form>
          </div>
          </>
        )  
    }
    </div>  
  )
};

export default SignupPage;