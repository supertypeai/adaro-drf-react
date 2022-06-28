import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";

const Register = ({
  handleSignupSubmit,
  visible,
  setVisible,
  message,
  error,
  handleChange,
  setStatus,
}) => {
  return (
    <Form
      name="login-form"
      initialValues={{ remember: true }}
      onSubmitCapture={handleSignupSubmit}
    >
      <p className="form-title">Register Your Account</p>
      {visible ? (
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
      ) : null}

      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your username." }]}
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
          SIGNUP
        </Button>
      </Form.Item>
      <small>
        <span>Already have an account? </span>
        <span
          className="link"
          onClick={() => {
            setStatus("login");
            setVisible(false);
          }}
        >
          Login here
        </span>
      </small>
    </Form>
  );
};

export default Register;
