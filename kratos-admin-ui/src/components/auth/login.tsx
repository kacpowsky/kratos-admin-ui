import {
  Button,
  Field,
  Input,
  Title1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { AuthService } from "../../service/auth-service";
import "./login.scss";

export function LoginComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (AuthService.login(username, password)) {
      history.push("/identities");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <Title1 as="h1">Kratos Admin Login</Title1>
        <form onSubmit={handleLogin}>
          <Field label="Username" required>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </Field>
          {error && (
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>{error}</MessageBarTitle>
              </MessageBarBody>
            </MessageBar>
          )}
          <Button type="submit" appearance="primary" style={{ marginTop: 10 }}>
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}

