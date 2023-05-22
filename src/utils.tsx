import {
  DataMap,
  Grant,
  Shareholder,
  ChartData,
  Share,
  ChartDataSets,
} from "./types";
import { ChartViewModes } from "./consts";

const addNumShares = (grants: number[], grant: DataMap<Grant>) => {
  return grants.reduce((acc, grantID) => acc + grant[grantID].amount, 0);
};

const addShareValues = (
  grants: number[],
  grant: DataMap<Grant>,
  shares: DataMap<Share>
) => {
  return grants.reduce((acc, grantID) => {
    const share =
      Object.values(shares).find((s) => s.shareType === grant[grantID].type) ||
      ({} as Share);
    return acc + grant[grantID].amount * parseFloat(share.currentValue);
  }, 0);
};

export const calculateChartData = (
  shareholder: DataMap<Shareholder>,
  grant: DataMap<Grant>,
  shares: DataMap<Share>
): ChartDataSets => {
  return {
    [ChartViewModes.ByInvestor]: {
      number: Object.values(shareholder)
        .map((s) => ({
          x: s.name,
          y: addNumShares(s.grants, grant),
        }))
        .filter((e) => e.y > 0),
      value: Object.values(shareholder)
        .map((s) => ({
          x: s.name,
          y: addShareValues(s.grants, grant, shares),
        }))
        .filter((e) => e.y > 0),
    },
    [ChartViewModes.ByGroup]: {
      number: ["investor", "founder", "employee"].map((group) => ({
        x: group,
        y: addNumShares(
          Object.values(shareholder)
            .filter((s) => s.group === group)
            .flatMap((s) => s.grants),
          grant
        ),
      })),
      value: ["investor", "founder", "employee"].map((group) => ({
        x: group,
        y: addShareValues(
          Object.values(shareholder)
            .filter((s) => s.group === group)
            .flatMap((s) => s.grants),
          grant,
          shares
        ),
      })),
    },
    [ChartViewModes.ByShareType]: {
      number: Object.values(shares).map(({ shareType }) => ({
        x: shareType,
        y: addNumShares(
          Object.values(grant)
            .filter((g) => g.type === shareType)
            .map((g) => g.id),
          grant
        ),
      })),
      value: Object.values(shares).map(({ shareType }) => ({
        x: shareType,
        y: addShareValues(
          Object.values(grant)
            .filter((g) => g.type === shareType)
            .map((g) => g.id),
          grant,
          shares
        ),
      })),
    },
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
