import React from "react";
import { withRouter } from "react-router-dom";
import { Button } from "@fluentui/react-components";
import { SignOutRegular } from "@fluentui/react-icons";
import { AuthService } from "../../service/auth-service";
import "./header.scss";

class HeaderComponent extends React.Component<any, any> {
  handleLogout = () => {
    AuthService.logout();
    this.props.history.push("/login");
  };

  render() {
    const isAuthenticated = AuthService.isAuthenticated();
    return (
      <header>
        <span
          onClick={() => {
            if (isAuthenticated) {
              this.props.history.push("/identities");
            }
          }}>
          kratos-admin-ui
        </span>
        {isAuthenticated && (
          <div className="header-actions">
            <Button
              appearance="subtle"
              icon={<SignOutRegular />}
              onClick={this.handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </header>
    );
  }
}

export default withRouter(HeaderComponent);
