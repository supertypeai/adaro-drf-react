import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { KeyOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import APIService from "../../APIService";

const InputToken = ({
  visible,
  setVisible,
  message,
  setMessage,
  setStatus,
  error,
  setError,
}) => {
  const [details, setDetails] = useState({
    uidb64: "",
    token: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    APIService.ResetPassword(details)
      .then((response) => {
        if (response.success === true) {
          setStatus("login");
          setError(false);
          setMessage({
            message: "Password Successfully Changed",
            description: "Login with your new password.",
          });
        }
      })
      .catch((error) => {
        setError(true);
        setMessage({
          message: "Error has occured",
          description: "Please check your token and your ID again.",
        });
      });
  };
  return (
    <Form
      name="login-form"
      initialValues={{ remember: true }}
      onSubmitCapture={handleSubmit}
    >
      <p className="form-title">Input Your New Password</p>
      <p>
        Enter the details that have been sent to your email, along with your new
        password down below.
      </p>
      {visible && (
        <Alert
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: "20px",
            textAlign: "left",
          }}
          message={message.message}
          description={message.description}
          type={error ? "error" : "success"}
          showIcon
          closable
          afterClose={() => setVisible(false)}
        />
      )}
      <Form.Item
        name="uidb64"
        rules={[{ required: true, message: "Please input your ID." }]}
      >
        <Input
          size="large"
          placeholder="Your User ID"
          prefix={<UserOutlined />}
          name="uidb64"
          onChange={handleChange}
        />
      </Form.Item>
      <Form.Item
        name="token"
        rules={[{ required: true, message: "Please input your token." }]}
      >
        <Input
          size="large"
          placeholder="Token"
          prefix={<KeyOutlined />}
          name="token"
          onChange={handleChange}
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your new password." }]}
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
          SUBMIT
        </Button>
      </Form.Item>
      <small>
        <span
          className="link"
          onClick={() => {
            setStatus("login");
          }}
        >
          Back to Login Page
        </span>
      </small>
    </Form>
  );
};

export default InputToken;
