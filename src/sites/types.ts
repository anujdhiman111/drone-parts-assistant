export type StockStatus = 'in_stock' | 'out_of_stock' | 'pre_order' | 'unknown';

export interface ProductStatus {
  name: string;
  price: number | null;
  status: StockStatus;
}

export interface SiteAdapter {
  id: string;
  hostname: string;
  scrape(url: string): Promise<ProductStatus>;
}
