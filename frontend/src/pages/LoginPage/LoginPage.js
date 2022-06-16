import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Button } from "antd";
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import adaroLogo from "../../images/adaro-logo.png";
import supertypeLogo from "../../images/supertype.png";

import "./LoginPage.css";


const LoginPage = () => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return(
    <div className="login-page">

      <div className="login-text">
        <img src={ adaroLogo } alt="adaro-logo" className="adaro-logo"/>
        <h1>BARITO RIVER <br/> WEB APP</h1>
        <div className="supertype-wrapper">
          <p>By</p>
          <img src={ supertypeLogo } alt="supertype-logo" className="supertype-logo"/>
        </div>
      </div>

      <div className="login-box">
        <Form
          name="login-form"
          initialValues={{ remember: true }}
        >
          <p className="form-title">Welcome Back</p>
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username.' }]}
          >
            <Input
              size="large"
              placeholder="Username"
              prefix={<UserOutlined />}
              onChange={(event) => setUsername(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button">
              LOGIN
            </Button>
          </Form.Item>
          <small>
            <span>Don't have an account? </span> 
            <Link to="/signup">Signup here</Link>
          </small>
        </Form>
      </div>

    </div>    
  )
};

export default LoginPage;