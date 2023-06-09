import { ChartViewModes, ShareTypes } from "./consts";
import { calculateChartData, calculateShareTotals } from "./utils";
import { DataMap, Shareholder } from "./types";

// TODO: Add more scenarios to make these tests more robust
describe("calculateChartData", () => {
  it("should return share data by investor, group, and share type", async () => {
    const shareholders: DataMap<Shareholder> = {
      0: { name: "Tonya", grants: [1, 4], group: "founder", id: 0 },
      1: { name: "Tony", grants: [2, 5], group: "employee", id: 1 },
      2: { name: "Tiffany", grants: [3, 6], group: "investor", id: 2 },
    };

    const grants = {
      1: {
        id: 1,
        name: "Initial Grant",
        amount: 10,
        issued: Date.now().toLocaleString(),
        type: ShareTypes.Common,
      },
      2: {
        id: 2,
        name: "Incentive Package 2020",
        amount: 10,
        issued: Date.now().toLocaleString(),
        type: ShareTypes.Common,
      },
      3: {
        id: 3,
        name: "Options Conversion 2020",
        amount: 10,
        issued: Date.now().toLocaleString(),
        type: ShareTypes.Common,
      },
      4: {
        id: 4,
        name: "Options Conversion 2019",
        amount: 10,
        issued: Date.now().toLocaleString(),
        type: ShareTypes.Preferred,
      },
      5: {
        id: 5,
        name: "Options Conversion 2020",
        amount: 10,
        issued: Date.now().toLocaleString(),
        type: ShareTypes.Preferred,
      },
      6: {
        id: 6,
        name: "Series A Purchase",
        amount: 10,
        issued: Date.now().toLocaleString(),
        type: ShareTypes.Preferred,
      },
    };

    const shares = {
      1: {
        id: 1,
        startValue: "5",
        currentValue: "5",
        shareType: ShareTypes.Common,
      },
      2: {
        id: 2,
        startValue: "5",
        currentValue: "10.00",
        shareType: ShareTypes.Preferred,
      },
    };

    const actual = calculateChartData(shareholders, grants, shares);

    const actualByGroupNumber = actual[ChartViewModes.ByGroup].number;
    const expectedByGroupNumber = [
      { x: "investor", y: 20 },
      { x: "employee", y: 20 },
      { x: "founder", y: 20 },
    ];

    expectedByGroupNumber.forEach((result) =>
      expect(actualByGroupNumber).toEqual(
        expect.arrayContaining([expect.objectContaining(result)])
      )
    );

    const actualByGroupValue = actual[ChartViewModes.ByGroup].value;
    const expectedByGroupValue = [
      { x: "investor", y: 150 },
      { x: "employee", y: 150 },
      { x: "founder", y: 150 },
    ];

    expectedByGroupValue.forEach((result) =>
      expect(actualByGroupValue).toEqual(
        expect.arrayContaining([expect.objectContaining(result)])
      )
    );

    const actualByInvestor = actual[ChartViewModes.ByInvestor].number;
    const expectedByInvestor = [
      { x: "Tony", y: 20 },
      { x: "Tonya", y: 20 },
      { x: "Tiffany", y: 20 },
    ];

    expectedByInvestor.forEach((result) =>
      expect(actualByInvestor).toEqual(
        expect.arrayContaining([expect.objectContaining(result)])
      )
    );

    const actualByInvestorValue = actual[ChartViewModes.ByInvestor].value;
    const expectedByInvestorValue = [
      { x: "Tony", y: 150 },
      { x: "Tonya", y: 150 },
      { x: "Tiffany", y: 150 },
    ];

    expectedByInvestorValue.forEach((result) =>
      expect(actualByInvestorValue).toEqual(
        expect.arrayContaining([expect.objectContaining(result)])
      )
    );

    const actualByShareType = actual[ChartViewModes.ByShareType].number;
    const expectedByShareType = [
      { x: ShareTypes.Common, y: 30 },
      { x: ShareTypes.Preferred, y: 30 },
    ];

    expectedByShareType.forEach((result) =>
      expect(actualByShareType).toEqual(
        expect.arrayContaining([expect.objectContaining(result)])
      )
    );

    const actualByShareTypeValue = actual[ChartViewModes.ByShareType].value;
    const expectedByShareTypeValue = [
      { x: ShareTypes.Common, y: 150 },
      { x: ShareTypes.Preferred, y: 300 },
    ];

    expectedByShareTypeValue.forEach((result) =>
      expect(actualByShareTypeValue).toEqual(
        expect.arrayContaining([expect.objectContaining(result)])
      )
    );
  });
});

describe("calculateShareTotals", () => {
  it("should return the total number and value of each share type along with the total number and valuation of all shares", async () => {
    const shares = {
      1: {
        id: 1,
        startValue: "5",
        currentValue: "5",
        shareType: ShareTypes.Common,
      },
      2: {
        id: 2,
        startValue: "5",
        currentValue: "10.00",
        shareType: ShareTypes.Preferred,
      },
    };

    const numSharesByShareType = [
      { x: ShareTypes.Common, y: 30 },
      { x: ShareTypes.Preferred, y: 30 },
    ];

    const actualShareTotals = calculateShareTotals(
      shares,
      numSharesByShareType
    );

    const { numShares: numCommonShares, valueShares: valueCommonShares } =
      actualShareTotals[ShareTypes.Common];
    const { numShares: numPreferredShares, valueShares: valuePreferredShares } =
      actualShareTotals[ShareTypes.Preferred];
    const { numShares: numTotalShares, valueShares: valueTotalShares } =
      actualShareTotals["total"];

    expect(numCommonShares).toEqual(30);
    expect(valueCommonShares).toEqual(150);
    expect(numPreferredShares).toEqual(30);
    expect(valuePreferredShares).toEqual(300);
    expect(numTotalShares).toEqual(60);
    expect(valueTotalShares).toEqual(450);
  });
});
