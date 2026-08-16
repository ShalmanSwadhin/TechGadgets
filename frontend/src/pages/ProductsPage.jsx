import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/products/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { useSeo } from '../hooks/useSeo';
import { SITE_NAME } from '../config/site';
import { CATEGORIES } from '../utils/categories';
import { FiPackage } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'popularity', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

// Pure/presentational: the category list + sort select. Driven entirely by
// props so the same markup can either apply instantly (desktop sidebar) or
// write to a draft that's only committed on "Done" (mobile sheet) — the
// component itself has no idea which mode it's in.
function FilterFields({ category, sort, onCategoryChange, onSortChange }) {
  return (
    <>
      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</h3>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                !category
                  ? 'bg-brand-500/10 font-semibold text-brand-600 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
            >
              All Products
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                onClick={() => onCategoryChange(c.name)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  category === c.name
                    ? 'bg-brand-500/10 font-semibold text-brand-600 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="input-field mt-3"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pages, setPages] = useState(1);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') || '';
  const page = Number(searchParams.get('page')) || 1;

  // Mobile filter sheet: edits apply to this draft only, never the real
  // (applied) category/sort above, until "Done" commits it. This is what
  // makes "Cancel" a true no-op — the applied filters were never touched.
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(category);
  const [draftSort, setDraftSort] = useState(sort);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (category) params.set('category', category);
        if (sort) params.set('sort', sort);
        if (featured) params.set('featured', featured);
        params.set('page', String(page));
        params.set('limit', '12');

        const { data } = await api.get(`/products?${params}`);
        setProducts(data.products);
        setPages(data.pages);
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, category, sort, featured, page]);

  useSeo({
    title: debouncedSearch
      ? `Search: ${debouncedSearch} | ${SITE_NAME}`
      : category
        ? `${category} | ${SITE_NAME}`
        : `Shop All Products | ${SITE_NAME}`,
    description: category
      ? `Browse ${category.toLowerCase()} at ${SITE_NAME} — premium electronics and accessories.`
      : `Browse the full ${SITE_NAME} collection of power banks, chargers, earbuds, and smart accessories.`,
  });

  // Lock background scroll while the sheet is open, and restore on close/
  // unmount — mirrors the same pattern the cart drawer already uses.
  useEffect(() => {
    if (filterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [filterOpen]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const openMobileFilters = () => {
    // Snapshot the currently-applied filters into the draft every time the
    // sheet opens, so Cancel always restores exactly this state.
    setDraftCategory(category);
    setDraftSort(sort);
    setFilterOpen(true);
  };

  const applyMobileFilters = () => {
    const next = new URLSearchParams(searchParams);
    if (draftCategory) next.set('category', draftCategory);
    else next.delete('category');
    if (draftSort) next.set('sort', draftSort);
    else next.delete('sort');
    next.delete('page');
    setSearchParams(next);
    setFilterOpen(false);
  };

  const cancelMobileFilters = () => {
    // Draft is discarded (never applied) and re-seeded from the real
    // filters next time the sheet opens — nothing to reset here.
    setFilterOpen(false);
  };

  const activeFilterCount = [category, sort].filter(Boolean).length;

  return (
    <div className="container-page py-8 pb-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            {category || 'All products'}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {debouncedSearch ? `Search results` : category || 'Shop Gadgets'}
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {category || debouncedSearch
              ? `Showing results for ${category || `"${debouncedSearch}"`}`
              : 'Browse our full collection of premium gadgets.'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-8">
        {/* Desktop sidebar — unchanged: every click applies immediately. */}
        <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
          <FilterFields
            category={category}
            sort={sort}
            onCategoryChange={(c) => updateParam('category', c)}
            onSortChange={(s) => updateParam('sort', s)}
          />
        </aside>

        <div className="flex-1">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50">
              {error}
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={FiPackage}
              title="No products found"
              description="Try adjusting your filters or search term."
              actionLabel="View All"
              actionTo="/products"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set('page', String(p));
                        setSearchParams(next);
                      }}
                      className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
                        p === page
                          ? 'bg-brand-gradient text-white shadow-glow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating filter trigger — mobile only. Fixed so it stays reachable
          while scrolling, positioned to clear both the bottom nav bar and
          the WhatsApp button (which sit at bottom-0 and bottom-20 right). */}
      <button
        type="button"
        onClick={openMobileFilters}
        className="fixed bottom-20 left-4 z-40 flex h-14 items-center gap-2 rounded-full bg-brand-gradient px-5 text-sm font-semibold text-white shadow-glow transition-transform duration-200 active:scale-95 lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={filterOpen}
      >
        <FiFilter className="text-lg" />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand-600">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile filter sheet */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 lg:hidden ${
          filterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={cancelMobileFilters}
        aria-hidden={!filterOpen}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
        className={`fixed inset-x-0 bottom-0 z-[70] flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900 lg:hidden ${
          filterOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h2 className="text-lg font-bold">Filters</h2>
          <button
            type="button"
            onClick={cancelMobileFilters}
            className="btn-ghost rounded-full p-2"
            aria-label="Close filters"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
          <FilterFields
            category={draftCategory}
            sort={draftSort}
            onCategoryChange={setDraftCategory}
            onSortChange={setDraftSort}
          />
        </div>

        <div className="flex shrink-0 gap-3 border-t border-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800">
          <button type="button" onClick={cancelMobileFilters} className="btn-secondary min-h-[44px] flex-1">
            Cancel
          </button>
          <button type="button" onClick={applyMobileFilters} className="btn-primary min-h-[44px] flex-1">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
