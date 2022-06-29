import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { MailOutlined } from "@ant-design/icons";

import APIService from "../../APIService";

const ResetPassword = ({ setMessage, visible, setVisible, message, setStatus, error, setError, setLoading }) => {
  const [resetInfo, setResetInfo] = useState({
    email: "",
  });
  const [form] = Form.useForm();
  const handleResetSubmit = (event) => {
    event.preventDefault();
    setLoading(true)
    APIService.RequestPasswordEmail(resetInfo)
      .then((resp) => {
        setError(false);
        setMessage({
          message: "Email Sent!",
          description: "Check your email to reset your password.",
        });
        setLoading(false);
        setStatus("reset-password-details");
        setVisible(true);

      })
      .catch(err => {
        setError(true);
        setMessage({
          message: "Reset Password Failed!",
          description: "This email is invalid."
        });
        setLoading(false)
        setStatus("reset-password-failed");
        form.resetFields()
        setVisible(true);
      })
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
      form={form}
      name="login-form"
      initialValues={{ remember: true }}
      onSubmitCapture={handleResetSubmit}
    >
      <p className="form-title">Forgot Password</p>
      <p>
        Enter your email address below, and we'll email instructions on setting
        a new password.
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
