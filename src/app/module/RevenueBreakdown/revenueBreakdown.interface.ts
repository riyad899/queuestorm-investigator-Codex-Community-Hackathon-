export interface IRevenueBreakdownQuery {
  months?: string;
  taxRate?: string;
  limit?: string;
}

export interface IRevenueBreakdownFullQuery {
  months?: string;
  taxRate?: string;
  limit?: string;
  categoryLimit?: string;
}
