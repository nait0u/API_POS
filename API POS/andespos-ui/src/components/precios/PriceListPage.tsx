import { usePrecios } from '../../hooks/usePrecios';
import { AppHeader } from './AppHeader';
import { HeroSummary } from './HeroSummary';
import { FiltersBar } from './FiltersBar';
import { PricesTable } from './PricesTable';
import { EditPriceDrawer } from './EditPriceDrawer';
import { ExpireDialog } from './ExpireDialog';
import { ImportDialog } from './ImportDialog';
import { CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export function PriceListPage() {
  const p = usePrecios();

  return (
    <div className="min-h-screen w-full bg-surface">
      {/* ─── Sticky Header ─── */}
      <AppHeader />

      {/* ─── Hero Banner ─── */}
      <HeroSummary
        vigentesCount={p.totalCount}
        lastUpdated={p.lastTimeStamp}
        onNewPrecio={p.openNew}
        onImport={p.openImport}
      />

      {/* ─── Toast ─── */}
      {p.toast && (
        <div
          className={clsx(
            'fixed top-20 right-6 z-[60] flex items-center gap-2.5 rounded-xl px-5 py-3.5 shadow-lg border text-sm font-medium',
            'animate-fade-up',
            p.toast.type === 'success'
              ? 'bg-success-50 border-success-100 text-success-700'
              : 'bg-danger-50 border-danger-100 text-danger-700',
          )}
          role="alert"
        >
          {p.toast.type === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />
          }
          {p.toast.message}
        </div>
      )}

      {/* ─── Body — NO max-width, stretches to fill screen ─── */}
      <main
        style={{ padding: '32px 40px' }}
      >
        {/* Filters Card */}
        <div style={{ marginBottom: '24px' }}>
          <FiltersBar
            filters={p.filters}
            ubicaciones={p.ubicaciones}
            onFiltersChange={p.setFilters}
            onSearch={(updatedFilters) => p.fetchPrecios(updatedFilters)}
            onClear={p.clearFilters}
          />
        </div>

        {/* Table Card */}
        <PricesTable
          items={p.displayItems}
          loading={p.loading}
          error={p.error}
          errorStatus={p.errorStatus}
          sort={p.sort}
          pagination={p.pagination}
          totalPages={p.totalPages}
          totalCount={p.filteredItems.length}
          onSort={p.toggleSort}
          onPageChange={p.setPage}
          onPageSizeChange={p.setPageSize}
          onEdit={p.openEdit}
          onExpire={p.openExpire}
          onRetry={() => p.fetchPrecios()}
          onNewPrecio={p.openNew}
          onImport={p.openImport}
        />
      </main>

      {/* ─── Drawer / Dialogs ─── */}
      <EditPriceDrawer
        open={p.drawerOpen}
        loading={p.editLoading}
        saving={p.saving}
        precioChar={p.editingBC}
        isNewMode={p.isNewMode}
        selectedProduct={p.selectedProduct}
        empKey={p.filters.EmpKey}
        ubicaciones={p.ubicaciones}
        onClose={p.closeDrawer}
        onSave={p.savePrecio}
        onSelectProduct={p.selectProductForNew}
        onClearProduct={p.clearSelectedProduct}
        onCreatePrecio={p.createNewPrecio}
      />
      <ExpireDialog
        target={p.expireTarget}
        saving={p.saving}
        onConfirm={p.confirmExpire}
        onClose={p.closeExpire}
      />
      <ImportDialog
        open={p.importOpen}
        saving={p.saving}
        onImport={p.doImport}
        onClose={p.closeImport}
      />
    </div>
  );
}
