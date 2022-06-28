import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { MailOutlined } from "@ant-design/icons";

import APIService from "../../APIService";

const ResetPassword = ({ setMessage, setVisible, setStatus }) => {
  const [resetInfo, setResetInfo] = useState({
    email: "",
  });

  const handleResetSubmit = (event) => {
    event.preventDefault();
    // setLoading(true);
    // send email
    APIService.RequestPasswordEmail(resetInfo);

    setMessage({
      message: "Email Sent!",
      description: "Check your email to reset your password.",
    });
    setVisible(true);
    setStatus("reset-password-details");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResetInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <Form
      name="login-form"
      initialValues={{ remember: true }}
      onSubmitCapture={handleResetSubmit}
    >
      <p className="form-title">Forgot Password</p>
      <p>
        Enter your email address below, and we'll email instructions on setting
        a new password.
      </p>
      <Form.Item
        name="email"
        rules={[{ required: true, message: "Please input your email." }]}
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

export default ResetPassword;
