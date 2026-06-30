import { ProductGrid } from '../features/pos/ProductGrid';
import { POSCart } from '../features/pos/POSCart';

export function POSPage() {
  return (
    <div className="pos-layout">
      <ProductGrid />
      <POSCart />
    </div>
  );
}
