import React from "react";
import { Route, Redirect } from "react-router-dom";
import { AuthService } from "../../service/auth-service";

interface PrivateRouteProps {
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}

export function PrivateRoute({
  component: Component,
  ...rest
}: PrivateRouteProps) {
  return (
    <Route
      {...rest}
      render={(props) =>
        AuthService.isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
}

