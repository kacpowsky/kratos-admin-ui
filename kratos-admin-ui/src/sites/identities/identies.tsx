import {
  Title1,
  Toolbar,
  ToolbarButton,
  DataGrid,
  DataGridHeader,
  DataGridBody,
  DataGridRow,
  DataGridHeaderCell,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  TableRowId,
  Input,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Field,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { Identity, IdentityApi } from "@ory/kratos-client";
import React from "react";
import { withRouter } from "react-router-dom";
import { getKratosConfig } from "../../config";
import {
  ArrowClockwiseRegular,
  ClipboardEditRegular,
  ContentViewRegular,
  DeleteRegular,
  MailRegular,
  NewRegular,
  FilterRegular,
} from "@fluentui/react-icons";
import { MessageService } from "../../components/messages/messagebar";

export interface ToolbarItem {
  text: string;
  key: string;
  onClick: () => void;
  icon: any;
}

interface IdentitiesState {
  commandBarItems: ToolbarItem[];
  tableItems: IdentityTableItem[];
  displayedItems: IdentityTableItem[];
  selectedRows: TableRowId[];
  searchQuery: string;
  showDeleteDialog: boolean;
  showAdvancedSearch: boolean;
  useRegex: boolean;
  searchField: "all" | "id" | "state" | "schema" | "email";
}

interface IdentityTableItem {
  id: string;
  state: string;
  schema: string;
  verifiable_addresses: string;
}

const columns: TableColumnDefinition<IdentityTableItem>[] = [
  createTableColumn<IdentityTableItem>({
    columnId: "verifiable_addresses",
    renderHeaderCell: () => {
      return "Verifiable Address";
    },
    renderCell: (item) => {
      return <span>{item.verifiable_addresses}</span>;
    },
    compare: (a, b) =>
      a.verifiable_addresses.localeCompare(b.verifiable_addresses),
  }),
  createTableColumn<IdentityTableItem>({
    columnId: "state",
    renderHeaderCell: () => {
      return "State";
    },
    renderCell: (item) => {
      return (
        <span style={{ color: item.state === "active" ? "green" : "red" }}>
          {item.state}
        </span>
      );
    },
    compare: (a, b) => a.state.localeCompare(b.state),
  }),
  createTableColumn<IdentityTableItem>({
    columnId: "schema",
    renderHeaderCell: () => {
      return "Schema";
    },
    renderCell: (item) => {
      return <span>{item.schema}</span>;
    },
    compare: (a, b) => a.schema.localeCompare(b.schema),
  }),
  createTableColumn<IdentityTableItem>({
    columnId: "id",
    renderHeaderCell: () => {
      return "ID";
    },
    renderCell: (item) => {
      return <span>{item.id}</span>;
    },
    compare: (a, b) => a.id.localeCompare(b.id),
  }),
];

class IdentitiesSite extends React.Component<any, IdentitiesState> {
  state: IdentitiesState = {
    commandBarItems: this.getCommandbarItems(0),
    tableItems: [],
    displayedItems: [],
    selectedRows: [],
    searchQuery: "",
    showDeleteDialog: false,
    showAdvancedSearch: false,
    useRegex: false,
    searchField: "all",
  };

  private api: IdentityApi | undefined;

  componentDidMount() {
    getKratosConfig().then((config) => {
      this.api = new IdentityApi(config.adminConfig);
      this.refreshData(false);
    });
  }

  private getCommandbarItems(localCount: number): ToolbarItem[] {
    const array: ToolbarItem[] = [];

    array.push({
      key: "new",
      text: "Create New",
      icon: NewRegular,
      onClick: () => {
        this.props.history.push("/identities/create");
      },
    });

    if (localCount === 1) {
      array.push({
        key: "view",
        text: "View",
        icon: ContentViewRegular,
        onClick: () => {
          this.props.history.push(
            "/identities/" + this.state.selectedRows[0] + "/view",
          );
        },
      });
      array.push({
        key: "edit",
        text: "Edit",
        icon: ClipboardEditRegular,
        onClick: () => {
          this.props.history.push(
            "/identities/" + this.state.selectedRows[0] + "/edit",
          );
        },
      });
    }
    if (localCount >= 1) {
      array.push({
        key: "delete",
        text: "Delete",
        icon: DeleteRegular,
        onClick: () => this.showDeleteConfirmation(),
      });
      array.push({
        key: "recoveryLink",
        text: "Recovery",
        icon: MailRegular,
        onClick: () => this.recoverySelected(),
      });
    }
    array.push({
      key: "refresh",
      text: "Refresh",
      icon: ArrowClockwiseRegular,
      onClick: () => this.refreshData(true),
    });

    return array;
  }

  private refreshData(showBanner: boolean) {
    this.refreshDataInternal(showBanner)
      .then(() => {})
      .catch((err) => {
        MessageService.Instance.dispatchMessage({
          message: {
            intent: "error",
            title: "failed to get identities",
          },
          removeAfterSeconds: 4000,
        });
      });
  }

  private async refreshDataInternal(showBanner: boolean) {
    const adminIdentitiesReturn = await this.api!.listIdentities();
    if (adminIdentitiesReturn) {
      const tableItems = this.mapIdentitysToTable(adminIdentitiesReturn.data);
      const displayedItems = this.state.searchQuery
        ? this.filterItems(tableItems, this.state.searchQuery)
        : tableItems;
      this.setState({
        tableItems: tableItems,
        displayedItems: displayedItems,
      });
    }

    if (showBanner) {
      MessageService.Instance.dispatchMessage({
        removeAfterSeconds: 2,
        message: {
          title: "identities refreshed",
          intent: "success",
        },
      });
    }
  }

  private mapIdentitysToTable(identities: Identity[]): IdentityTableItem[] {
    return identities.map((identity) => {
      return {
        id: identity.id,
        state: identity.state?.toString()!,
        schema: identity.schema_id,
        verifiable_addresses: identity.verifiable_addresses
          ?.map((e) => e.value)
          .join(", ")!,
      };
    });
  }

  private handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value;
    this.setState((prevState) => ({
      searchQuery,
      displayedItems: searchQuery
        ? this.filterItems(prevState.tableItems, searchQuery, prevState.useRegex, prevState.searchField)
        : prevState.tableItems,
    }));
  };

  private filterItems = (
    items: IdentityTableItem[],
    query: string,
    useRegex: boolean,
    searchField: "all" | "id" | "state" | "schema" | "email",
  ): IdentityTableItem[] => {
    if (!query) return items;

    try {
      if (useRegex) {
        const regex = new RegExp(query, "i");
        return items.filter((item) => {
          if (searchField === "all") {
            return (
              regex.test(item.id) ||
              regex.test(item.state) ||
              regex.test(item.schema) ||
              regex.test(item.verifiable_addresses)
            );
          } else if (searchField === "id") {
            return regex.test(item.id);
          } else if (searchField === "state") {
            return regex.test(item.state);
          } else if (searchField === "schema") {
            return regex.test(item.schema);
          } else if (searchField === "email") {
            return regex.test(item.verifiable_addresses);
          }
          return false;
        });
      } else {
        const lowerQuery = query.toLowerCase();
        return items.filter((item) => {
          if (searchField === "all") {
            return (
              item.id.toLowerCase().includes(lowerQuery) ||
              item.state.toLowerCase().includes(lowerQuery) ||
              item.schema.toLowerCase().includes(lowerQuery) ||
              item.verifiable_addresses.toLowerCase().includes(lowerQuery)
            );
          } else if (searchField === "id") {
            return item.id.toLowerCase().includes(lowerQuery);
          } else if (searchField === "state") {
            return item.state.toLowerCase().includes(lowerQuery);
          } else if (searchField === "schema") {
            return item.schema.toLowerCase().includes(lowerQuery);
          } else if (searchField === "email") {
            return item.verifiable_addresses.toLowerCase().includes(lowerQuery);
          }
          return false;
        });
      }
    } catch (error) {
      // Invalid regex, fallback to simple search
      const lowerQuery = query.toLowerCase();
      return items.filter(
        (item) =>
          item.id.toLowerCase().includes(lowerQuery) ||
          item.state.toLowerCase().includes(lowerQuery) ||
          item.schema.toLowerCase().includes(lowerQuery) ||
          item.verifiable_addresses.toLowerCase().includes(lowerQuery),
      );
    }
  };

  private toggleAdvancedSearch = () => {
    this.setState((prevState) => ({
      showAdvancedSearch: !prevState.showAdvancedSearch,
    }));
  };

  private handleRegexChange = (checked: boolean) => {
    this.setState(
      (prevState) => ({
        useRegex: checked,
        displayedItems: prevState.searchQuery
          ? this.filterItems(prevState.tableItems, prevState.searchQuery, checked, prevState.searchField)
          : prevState.tableItems,
      }),
    );
  };

  private handleSearchFieldChange = (field: "all" | "id" | "state" | "schema" | "email") => {
    this.setState(
      (prevState) => ({
        searchField: field,
        displayedItems: prevState.searchQuery
          ? this.filterItems(prevState.tableItems, prevState.searchQuery, prevState.useRegex, field)
          : prevState.tableItems,
      }),
    );
  };

  private showDeleteConfirmation() {
    this.setState({ showDeleteDialog: true });
  }

  private closeDeleteDialog() {
    this.setState({ showDeleteDialog: false });
  }

  private deleteSelected() {
    const values = this.state.selectedRows;
    const promises: Promise<any>[] = [];
    values.forEach((val) => {
      promises.push(
        this.api!.deleteIdentity({
          id: val + "",
        }),
      );
    });
    Promise.all(promises)
      .then(() => {
        this.closeDeleteDialog();
        this.refreshData(false);
        MessageService.Instance.dispatchMessage({
          removeAfterSeconds: 2,
          message: {
            title: "selected identites deleted",
            intent: "success",
          },
        });
      })
      .catch((err) => {
        this.closeDeleteDialog();
        MessageService.Instance.dispatchMessage({
          removeAfterSeconds: 5,
          message: {
            title: "failed to delete identites",
            intent: "error",
            content: (
              <div>
                <span>See console logs for more informations</span>
              </div>
            ),
          },
        });
      });
  }

  private recoverySelected() {
    const values = this.state.selectedRows;
    const promises: Promise<any>[] = [];
    values.forEach((val) => {
      promises.push(
        this.api!.createRecoveryLinkForIdentity({
          createRecoveryLinkForIdentityBody: {
            identity_id: val + "",
          },
        }),
      );
    });
    Promise.all(promises)
      .then(() => {
        MessageService.Instance.dispatchMessage({
          removeAfterSeconds: 2,
          message: {
            title: "selected identites recovered",
            intent: "success",
          },
        });
      })
      .catch((err) => {
        MessageService.Instance.dispatchMessage({
          removeAfterSeconds: 5,
          message: {
            title: "failed to recover identites",
            intent: "error",
            content: (
              <div>
                <span>See console logs for more informations</span>
              </div>
            ),
          },
        });
      });
  }
  render() {
    return (
      <div className="container">
        <Title1 as={"h1"}>Identities</Title1>
        <div style={{ marginTop: 10 }}>
          <Toolbar>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}>
              <div>
                {this.state.commandBarItems.map((item) => {
                  const CustomIcon = item.icon;
                  return (
                    <ToolbarButton
                      key={item.key}
                      onClick={() => item.onClick()}>
                      <CustomIcon />
                      <span style={{ paddingLeft: 4 }}>{item.text}</span>
                    </ToolbarButton>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="Search ..."
                  value={this.state.searchQuery}
                  onChange={this.handleSearchChange}
                  style={{ width: 300 }}
                />
                <ToolbarButton
                  icon={<FilterRegular />}
                  onClick={this.toggleAdvancedSearch}
                  appearance={this.state.showAdvancedSearch ? "primary" : "subtle"}>
                  Advanced
                </ToolbarButton>
              </div>
            </div>
          </Toolbar>
        </div>

        {this.state.showAdvancedSearch && (
          <div
            style={{
              marginTop: 10,
              padding: 15,
              backgroundColor: "var(--colorNeutralBackground2)",
              borderRadius: 4,
              border: "1px solid var(--colorNeutralStroke1)",
            }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <Field label="Search in">
                <Dropdown
                  value={this.state.searchField}
                  onOptionSelect={(e, data) => {
                    if (data.optionValue) {
                      this.handleSearchFieldChange(
                        data.optionValue as
                          | "all"
                          | "id"
                          | "state"
                          | "schema"
                          | "email",
                      );
                    }
                  }}>
                  <Option value="all">All Fields</Option>
                  <Option value="id">ID</Option>
                  <Option value="state">State</Option>
                  <Option value="schema">Schema</Option>
                  <Option value="email">Email</Option>
                </Dropdown>
              </Field>
              <Checkbox
                label="Use Regular Expression"
                checked={this.state.useRegex}
                onChange={(e, data) => this.handleRegexChange(data.checked || false)}
              />
              {this.state.useRegex && (
                <span style={{ fontSize: 12, color: "var(--colorNeutralForeground3)" }}>
                  Example: ^[a-z]+@example\.com$ (case-insensitive)
                </span>
              )}
            </div>
          </div>
        )}

        <DataGrid
          selectionMode="multiselect"
          items={this.state.displayedItems}
          columns={columns}
          sortable
          resizableColumns
          getRowId={(item: IdentityTableItem) => item.id}
          onSelectionChange={(e, data) => {
            this.setState({
              commandBarItems: this.getCommandbarItems(data.selectedItems.size),
              selectedRows: Array.from(data.selectedItems.values()),
            });
          }}
          columnSizingOptions={{
            id: {
              defaultWidth: 300,
            },
            state: {
              defaultWidth: 60,
              minWidth: 60,
            },
            schema: {
              defaultWidth: 80,
            },
            verifiable_addresses: {
              defaultWidth: 300,
            },
          }}>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<IdentityTableItem>>
            {({ item, rowId }) => (
              <DataGridRow<IdentityTableItem>
                key={rowId}
                onDoubleClick={() => {
                  this.props.history.push("/identities/" + rowId + "/view");
                }}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>

        <Dialog open={this.state.showDeleteDialog}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogContent>
                {this.state.selectedRows.length === 1 ? (
                  <p>
                    Are you sure you want to delete the selected identity? This
                    operation is irreversible.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to delete {this.state.selectedRows.length}{" "}
                    selected identities? This operation is irreversible.
                  </p>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => this.closeDeleteDialog()}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={() => this.deleteSelected()}>
                  Delete
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    );
  }
}

export default withRouter(IdentitiesSite);
