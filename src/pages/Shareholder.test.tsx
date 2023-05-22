import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { getTestRouter, server, ThemeWrapper } from "../testutils";
import { ShareholderPage } from "./Shareholder";
import { Route, Routes } from "react-router";
import { getHandlers } from "../handlers";
import userEvent from "@testing-library/user-event";
import { ShareTypes } from "../consts";
import { Company, Grant, Share, Shareholder } from "../types";

interface ShareholdersInitialState {
  company: Company;
  shareholders: Record<number, Shareholder>;
  grants: Record<number, Grant>;
  shares: Record<number, Share>;
}

describe("ShareholderPage", () => {
  let params: ShareholdersInitialState;

  beforeEach(() => {
    params = {
      company: { name: "My Company" },
      shareholders: {
        0: { name: "Tonya", grants: [1, 2], group: "founder", id: 0 },
      },
      grants: {
        1: {
          id: 1,
          name: "Initial Grant",
          amount: 1000,
          issued: Date.now().toLocaleString(),
          type: ShareTypes.Common,
        },
        2: {
          id: 2,
          name: "Incentive Package 2020",
          amount: 500,
          issued: Date.now().toLocaleString(),
          type: ShareTypes.Preferred,
        },
      },
      shares: {
        1: {
          id: 1,
          shareType: ShareTypes.Common,
          value: "1.5",
        },
        2: {
          id: 2,
          shareType: ShareTypes.Preferred,
          value: "5",
        },
      },
    };
  });

  it("should show a summary of shares", async () => {
    const Router = getTestRouter("/shareholder/0");
    const handlers = getHandlers(params, false);
    server.use(...handlers);

    render(
      <Router>
        <Routes>
          <Route
            path="/shareholder/:shareholderID"
            element={<ShareholderPage />}
          />
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );

    await screen.findByRole("button", { name: /Add Grant/ });

    expect(screen.getByTestId("grants-issued")).toHaveTextContent("2");
    expect(screen.getByTestId("shares-granted")).toHaveTextContent("1500");
  });

  it("should allow adding new grants for preferred shares", async () => {
    const Router = getTestRouter("/shareholder/0");
    const handlers = getHandlers(params, false);
    server.use(...handlers);

    render(
      <Router>
        <Routes>
          <Route
            path="/shareholder/:shareholderID"
            element={<ShareholderPage />}
          />
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );

    const addGrantButton = await screen.findByRole("button", {
      name: /Add Grant/,
    });
    const grantTable = screen.getAllByRole("rowgroup")[1];
    expect(within(grantTable).getAllByRole("row")).toHaveLength(2);

    await userEvent.click(addGrantButton);

    const grantNameInput = screen.getByTestId("grant-name");
    const grantShareTypeSelect = screen.getByTestId("grant-share-type");
    const grantAmountInput = screen.getByTestId("grant-amount");
    const grantDateInput = screen.getByTestId("grant-issued");

    await waitFor(() => {
      expect(grantNameInput).toBeVisible();
    });

    await userEvent.click(grantNameInput);
    await userEvent.type(grantNameInput, "Incentive Package 2019");
    await userEvent.selectOptions(grantShareTypeSelect, ShareTypes.Preferred);

    await userEvent.click(grantAmountInput);
    await userEvent.type(grantAmountInput, "2000");
    await userEvent.click(grantDateInput);
    await userEvent.type(grantDateInput, "2010-12-12");
    expect(grantNameInput).toHaveValue();
    expect(grantAmountInput).toHaveValue();
    expect(grantDateInput).toHaveValue();

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await userEvent.click(saveButton);

    expect(
      await within(grantTable).findByText(/Incentive Package 2019/)
    ).toBeInTheDocument();
    expect(within(grantTable).getByText("2,000")).toBeInTheDocument();
    expect(
      within(grantTable).getByText(new Date("2010-12-12").toLocaleDateString())
    ).toBeInTheDocument();
    expect(within(grantTable).getAllByText(ShareTypes.Preferred)).toHaveLength(
      2
    );
  });

  it("should allow adding new grants for common shares", async () => {
    const Router = getTestRouter("/shareholder/0");
    const handlers = getHandlers(params, false);
    server.use(...handlers);

    render(
      <Router>
        <Routes>
          <Route
            path="/shareholder/:shareholderID"
            element={<ShareholderPage />}
          />
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );

    const addGrantButton = await screen.findByRole("button", {
      name: /Add Grant/,
    });
    const grantTable = screen.getAllByRole("rowgroup")[1];
    expect(within(grantTable).getAllByRole("row")).toHaveLength(2);

    await userEvent.click(addGrantButton);

    const grantNameInput = screen.getByTestId("grant-name");
    const grantShareTypeSelect = screen.getByTestId("grant-share-type");
    const grantAmountInput = screen.getByTestId("grant-amount");
    const grantDateInput = screen.getByTestId("grant-issued");

    await waitFor(() => {
      expect(grantNameInput).toBeVisible();
    });

    await userEvent.click(grantNameInput);
    await userEvent.type(grantNameInput, "Incentive Package 2019");
    await userEvent.selectOptions(grantShareTypeSelect, ShareTypes.Common);

    await userEvent.click(grantAmountInput);
    await userEvent.type(grantAmountInput, "2000");
    await userEvent.click(grantDateInput);
    await userEvent.type(grantDateInput, "2010-12-12");
    expect(grantNameInput).toHaveValue();
    expect(grantAmountInput).toHaveValue();
    expect(grantDateInput).toHaveValue();

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await userEvent.click(saveButton);

    expect(
      await within(grantTable).findByText(/Incentive Package 2019/)
    ).toBeInTheDocument();
    expect(within(grantTable).getByText("2,000")).toBeInTheDocument();
    expect(
      within(grantTable).getByText(new Date("2010-12-12").toLocaleDateString())
    ).toBeInTheDocument();
    expect(within(grantTable).getAllByText(ShareTypes.Common)).toHaveLength(2);
  });
});
