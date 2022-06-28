import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const Login = ({
  handleLoginSubmit,
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
      onSubmitCapture={handleLoginSubmit}
    >
      <p className="form-title">Welcome Back</p>
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
        name="password"
        rules={[{ required: true, message: "Please input your password." }]}
        style={{ marginBottom: "5px" }}
      >
        <Input.Password
          size="large"
          placeholder="Password"
          name="password"
          prefix={<LockOutlined />}
          onChange={handleChange}
        />
      </Form.Item>
      <div style={{ textAlign: "end", marginBottom: "10px" }}>
        <small
          className="link"
          onClick={() => {
            setStatus("reset-password");
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
        <span
          className="link"
          onClick={() => {
            setStatus("signup");
            setVisible(false);
          }}
        >
          Signup here
        </span>
      </small>
    </Form>
  );
};

export default Login;
