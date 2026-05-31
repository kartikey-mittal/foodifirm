import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';

export function InventoryPage() {
  return (
    <PageContainer title="Inventory" description="Track your kitchen inventory and stock levels.">
      <EmptyState
        icon={<Package className="h-12 w-12" />}
        title="Inventory Module Coming Soon"
        description="The inventory management module is reserved for future expansion. You'll be able to track ingredients, stock levels, and automate reordering."
      />
    </PageContainer>
  );
}
