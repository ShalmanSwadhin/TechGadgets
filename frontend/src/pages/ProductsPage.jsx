import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/products/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { CATEGORIES } from '../utils/categories';
import { FiPackage } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'popularity', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') || '';
  const page = Number(searchParams.get('page')) || 1;

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

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

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
        <button
          type="button"
          className="btn-secondary lg:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filters
        </button>
      </div>

      <div className="mt-8 flex gap-8">
        <aside
          className={`w-64 shrink-0 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}
        >
          <div className="card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</h3>
            <ul className="mt-3 space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => updateParam('category', '')}
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
                    onClick={() => updateParam('category', c.name)}
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
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field mt-3"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
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
    </div>
  );
}
