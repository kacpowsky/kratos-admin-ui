import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  Route,
  BrowserRouter as Router,
  Switch,
  Redirect,
} from "react-router-dom";
import HeaderComponent from "./components/header/header";
import FooterComponent from "./components/footer/footer";
import "./index.scss";
import { FluentProvider, webDarkTheme } from "@fluentui/react-components";
import { MessageBarComponent } from "./components/messages/messagebar";
import { LoginComponent } from "./components/auth/login";
import { PrivateRoute } from "./components/auth/private-route";
import { AuthService } from "./service/auth-service";

const IdentitiesSite = React.lazy(() => import("./sites/identities/identies"));
const CreateIdentitySite = React.lazy(
  () => import("./sites/identities/create/create"),
);
const ViewIdentitySite = React.lazy(
  () => import("./sites/identities/view/view"),
);
const EditIdentitySite = React.lazy(
  () => import("./sites/identities/edit/edit"),
);
const OverviewSite = React.lazy(() => import("./sites/overview"));

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <FluentProvider theme={webDarkTheme}>
      <Router>
        <div className="outerDIV">
          <HeaderComponent />
          <div className="contentDIV">
            <MessageBarComponent></MessageBarComponent>
            <Suspense fallback={<div> Loading...</div>}>
              <Switch>
                <Route path="/login">
                  {AuthService.isAuthenticated() ? (
                    <Redirect to="/identities" />
                  ) : (
                    <LoginComponent />
                  )}
                </Route>
                <PrivateRoute
                  path="/identities/create"
                  component={CreateIdentitySite}
                />
                <PrivateRoute
                  path="/identities/:id/view"
                  component={ViewIdentitySite}
                />
                <PrivateRoute
                  path="/identities/:id/edit"
                  component={EditIdentitySite}
                />
                <PrivateRoute path="/identities" component={IdentitiesSite} />
                <PrivateRoute path="/overview" component={OverviewSite} />
                <Redirect
                  from="*"
                  to={AuthService.isAuthenticated() ? "/identities" : "/login"}
                />
              </Switch>
            </Suspense>
          </div>
          <FooterComponent></FooterComponent>
        </div>
      </Router>
    </FluentProvider>
  </React.StrictMode>,
);
