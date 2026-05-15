export interface IMonthlyRevenueQuery {
  months?: string;
}

export interface IRecentOrdersQuery {
  limit?: string;
}

export interface ICategorySalesQuery {
  limit?: string;
}

export interface ILowStockQuery {
  threshold?: string;
  limit?: string;
}

export interface IFullOverviewQuery {
  months?: string;
  recentLimit?: string;
  categoryLimit?: string;
  lowStockLimit?: string;
  threshold?: string;
}
