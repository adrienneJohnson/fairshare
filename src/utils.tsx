import { DataMap, Grant, Shareholder, ChartData, Share } from "./types";
import { ChartViewModes } from "./consts";

export const calculateChartData = (
  shareholder: DataMap<Shareholder>,
  grant: DataMap<Grant>,
  shares: DataMap<Share>
): Record<string, ChartData[]> => {
  return {
    [ChartViewModes.ByInvestor]: Object.values(shareholder)
      .map((s) => ({
        x: s.name,
        y: s.grants.reduce(
          (acc: number, grantID: number) => acc + grant[grantID].amount,
          0
        ),
      }))
      .filter((e) => e.y > 0),
    [ChartViewModes.ByGroup]: ["investor", "founder", "employee"].map(
      (group) => ({
        x: group,
        y: Object.values(shareholder)
          .filter((s) => s.group === group)
          .flatMap((s) => s.grants)
          .reduce((acc, grantID: number) => acc + grant[grantID].amount, 0),
      })
    ),
    [ChartViewModes.ByShareType]: Object.values(shares).map(
      ({ shareType }) => ({
        x: shareType,
        y: Object.values(grant)
          .filter((g) => g.type === shareType)
          .reduce((acc, grant) => acc + grant.amount, 0),
      })
    ),
  };
};

export const calculateShareTotals = (
  shares: DataMap<Share>,
  chartDataByShareType: ChartData[]
): { [key: string]: { numShares: number; valueShares: number } } => {
  return Object.values(shares).reduce(
    (acc, shareType) => {
      const { y: numShares } =
        chartDataByShareType.find(
          (data: ChartData) => data["x"] === shareType.shareType
        ) || ({} as ChartData);

      const valueShares = numShares * parseFloat(shareType.currentValue);

      return {
        ...acc,
        [shareType.shareType]: {
          numShares,
          valueShares,
        },
        total: {
          numShares: acc.total.numShares + numShares,
          valueShares: acc.total.valueShares + valueShares,
        },
      };
    },
    { total: { numShares: 0, valueShares: 0 } }
  );
};
