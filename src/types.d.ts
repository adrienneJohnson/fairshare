import { ShareTypes } from "./consts";
export interface User {
  name: string;
  email: string;
  shareholderID?: number;
}
export interface Company {
  name: string;
}

export type ShareType = (typeof ShareTypes)[keyof typeof ShareTypes];
export interface Grant {
  id: number;
  name: string;
  amount: number;
  issued: string;
  type: ShareType;
}
export interface Shareholder {
  id: number;
  name: string;
  // TODO: allow inviting/creating user account for orphan shareholders
  email?: string;
  grants: number[];
  group: "employee" | "founder" | "investor";
}
