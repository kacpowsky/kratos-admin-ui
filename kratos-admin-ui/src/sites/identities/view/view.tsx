import {
  Button,
  Title1,
  Title2,
  Toolbar,
  ToolbarButton,
} from "@fluentui/react-components";
import {
  CopyRegular,
  ClipboardCodeRegular,
  DocumentRegular,
  DocumentPdfRegular,
} from "@fluentui/react-icons";
import { IdentityApi, Identity, IdentityCredentials } from "@ory/kratos-client";
import React, { ReactNode } from "react";
import { withRouter } from "react-router-dom";
import { getKratosConfig } from "../../../config";
import { ListSessions } from "../../../components/sessions/list-sessions";
import { MessageService } from "../../../components/messages/messagebar";
import "./view.scss";

interface ViewIdentityState {
  identity?: Identity;
}

export class ViewIdentitySite extends React.Component<any, ViewIdentityState> {
  state: ViewIdentityState = {};

  componentDidMount() {
    getKratosConfig().then((config) => {
      const api = new IdentityApi(config.adminConfig);
      api
        .getIdentity({
          id: this.props.match.params.id,
        })
        .then((data) => {
          this.setState({
            identity: data.data,
          });
        })
        .catch((err) => {
          this.setState({
            identity: err.response.data,
          });
        });
    });
  }

  isObject(object: any) {
    return typeof object === "object" && object !== null;
  }

  getStringValue(any: any): string {
    if (typeof any === "boolean") {
      return any.toString();
    }
    return any;
  }

  getUnorderdList(object: any): ReactNode {
    return (
      <ul>
        {Object.keys(object).map((element, index) => {
          return (
            <div key={index}>
              {!this.isObject(object[element]) || (
                <li>
                  <b>{element}</b>:{this.getUnorderdList(object[element])}
                </li>
              )}
              {this.isObject(object[element]) || (
                <li>
                  <b>{element}</b>: {this.getStringValue(object[element])}
                </li>
              )}
            </div>
          );
        })}
      </ul>
    );
  }

  navigateToEdit() {
    this.props.history.push("/identities/" + this.state.identity?.id + "/edit");
  }

  renderSideElement(name: string, value?: string): React.ReactNode {
    return (
      <div>
        <p>
          <b>{name}</b>
          <br />
          {value}
        </p>
      </div>
    );
  }

  mapListElement(list?: any[]): string {
    if (list) {
      return list.map((e) => e.value).join(", ");
    }
    return "";
  }

  mapCredentials(credentials?: { [key: string]: IdentityCredentials }): string {
    if (credentials) {
      return Object.entries(credentials)
        .map((e) => {
          return e[0] + " (" + e[1].identifiers + ")";
        })
        .join(", ");
    }
    return "";
  }

  copyToClipboard(text: string, label: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        MessageService.Instance.dispatchMessage({
          message: {
            intent: "success",
            title: `${label} copied to clipboard`,
          },
          removeAfterSeconds: 2,
        });
      })
      .catch(() => {
        MessageService.Instance.dispatchMessage({
          message: {
            intent: "error",
            title: `Failed to copy ${label}`,
          },
          removeAfterSeconds: 3,
        });
      });
  }

  copyId() {
    if (this.state.identity?.id) {
      this.copyToClipboard(this.state.identity.id, "ID");
    }
  }

  copyEmail() {
    const emails = this.mapListElement(
      this.state.identity?.verifiable_addresses,
    );
    if (emails) {
      this.copyToClipboard(emails, "Email addresses");
    } else {
      MessageService.Instance.dispatchMessage({
        message: {
          intent: "warning",
          title: "No email addresses found",
        },
        removeAfterSeconds: 2,
      });
    }
  }

  copyAllData() {
    if (this.state.identity) {
      const data = JSON.stringify(this.state.identity, null, 2);
      this.copyToClipboard(data, "Identity data");
    }
  }

  exportToJSON() {
    if (this.state.identity) {
      const data = JSON.stringify(this.state.identity, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `identity-${this.state.identity.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      MessageService.Instance.dispatchMessage({
        message: {
          intent: "success",
          title: "Identity exported to JSON",
        },
        removeAfterSeconds: 2,
      });
    }
  }

  exportToPDF() {
    if (!this.state.identity) return;

    // Create a simple HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Identity ${this.state.identity.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Identity Details</h1>
          <div class="section">
            <span class="label">ID:</span>
            <span class="value">${this.state.identity.id}</span>
          </div>
          <div class="section">
            <span class="label">State:</span>
            <span class="value">${this.state.identity.state || "N/A"}</span>
          </div>
          <div class="section">
            <span class="label">Schema ID:</span>
            <span class="value">${this.state.identity.schema_id || "N/A"}</span>
          </div>
          <div class="section">
            <span class="label">Created At:</span>
            <span class="value">${this.state.identity.created_at || "N/A"}</span>
          </div>
          <div class="section">
            <span class="label">Updated At:</span>
            <span class="value">${this.state.identity.updated_at || "N/A"}</span>
          </div>
          <div class="section">
            <span class="label">Verifiable Addresses:</span>
            <span class="value">${this.mapListElement(this.state.identity.verifiable_addresses) || "None"}</span>
          </div>
          <div class="section">
            <span class="label">Recovery Addresses:</span>
            <span class="value">${this.mapListElement(this.state.identity.recovery_addresses) || "None"}</span>
          </div>
          <div class="section">
            <span class="label">Traits:</span>
            <pre>${JSON.stringify(this.state.identity.traits, null, 2)}</pre>
          </div>
          <div class="section">
            <span class="label">Public Metadata:</span>
            <pre>${JSON.stringify(this.state.identity.metadata_public, null, 2)}</pre>
          </div>
          <div class="section">
            <span class="label">Admin Metadata:</span>
            <pre>${JSON.stringify(this.state.identity.metadata_admin, null, 2)}</pre>
          </div>
          <div class="section">
            <span class="label">Credentials:</span>
            <pre>${JSON.stringify(this.state.identity.credentials, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;

    // Open new window and print to PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        MessageService.Instance.dispatchMessage({
          message: {
            intent: "success",
            title: "PDF export initiated",
          },
          removeAfterSeconds: 2,
        });
      };
    } else {
      MessageService.Instance.dispatchMessage({
        message: {
          intent: "error",
          title: "Failed to open print dialog. Please allow popups.",
        },
        removeAfterSeconds: 3,
      });
    }
  }

  render() {
    return (
      <div className="container">
        <Title1 as={"h1"}>View Identity</Title1>
        {!this.state.identity || (
          <div style={{ marginTop: 10 }}>
            <div className="splitview">
              <div className="plainJSON">
                {this.getUnorderdList(this.state.identity)}
              </div>
              <div>
                {this.renderSideElement("id", this.state.identity.id)}
                {this.renderSideElement(
                  "traits",
                  JSON.stringify(this.state.identity.traits),
                )}
                {this.renderSideElement(
                  "metadata_public",
                  JSON.stringify(this.state.identity.metadata_public),
                )}
                {this.renderSideElement(
                  "metadata_admin",
                  JSON.stringify(this.state.identity.metadata_admin),
                )}
                {this.renderSideElement("state", this.state.identity.state)}
                {this.renderSideElement(
                  "created_at",
                  this.state.identity.created_at,
                )}
                {this.renderSideElement(
                  "updated_at",
                  this.state.identity.updated_at,
                )}
                {this.renderSideElement(
                  "verifiable_addresses",
                  this.mapListElement(this.state.identity.verifiable_addresses),
                )}
                {this.renderSideElement(
                  "recovery_addresses",
                  this.mapListElement(this.state.identity.recovery_addresses),
                )}
                {this.renderSideElement(
                  "credentials",
                  this.mapCredentials(this.state.identity.credentials),
                )}
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <Toolbar style={{ marginBottom: 10 }}>
                <ToolbarButton
                  icon={<CopyRegular />}
                  onClick={() => this.copyId()}>
                  Copy ID
                </ToolbarButton>
                <ToolbarButton
                  icon={<CopyRegular />}
                  onClick={() => this.copyEmail()}>
                  Copy Email
                </ToolbarButton>
                <ToolbarButton
                  icon={<ClipboardCodeRegular />}
                  onClick={() => this.copyAllData()}>
                  Copy All Data (JSON)
                </ToolbarButton>
                <ToolbarButton
                  icon={<DocumentRegular />}
                  onClick={() => this.exportToJSON()}>
                  Export JSON
                </ToolbarButton>
                <ToolbarButton
                  icon={<DocumentPdfRegular />}
                  onClick={() => this.exportToPDF()}>
                  Export PDF
                </ToolbarButton>
              </Toolbar>
              <div style={{ display: "flex", gap: 20 }}>
                <Button
                  appearance="primary"
                  onClick={() => this.navigateToEdit()}>
                  Edit
                </Button>
                <Button onClick={() => this.props.history.push("/identities")}>
                  Close
                </Button>
              </div>
            </div>
            <div>
              <Title2 as="h2">Sessions</Title2>
              <ListSessions identity_id={this.state.identity.id}></ListSessions>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(ViewIdentitySite);
