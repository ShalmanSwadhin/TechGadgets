import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import { CATEGORIES } from '../../utils/categories';

const emptyProduct = {
  title: '',
  description: '',
  category: 'Power Banks',
  brand: '',
  price: '',
  discountPrice: '',
  stock: '',
  sku: '',
  warranty: '1 year',
  tags: '',
  thumbnail: '',
  images: '',
  featured: false,
  newArrival: false,
  specifications: [],
  variants: [],
};

// Stable, content-independent id for list rows (specifications/variants) so
// React's key never changes while the admin is typing into that row — using
// the typed text itself as (part of) the key was the cause of a real bug:
// each keystroke changed the key, which made React unmount/remount the
// input and drop focus after every character.
const newRowId = () =>
  globalThis.crypto?.randomUUID?.() || `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const hasValue = (v) => v !== '' && v != null;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products?limit=100');
      setProducts(data.products);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreate = () => {
    setForm(emptyProduct);
    setFiles([]);
    setModal('create');
  };

  const openEdit = (product) => {
    setForm({
      title: product.title ?? '',
      description: product.description ?? '',
      category: product.category || emptyProduct.category,
      brand: product.brand ?? '',
      price: product.price ?? '',
      discountPrice: product.discountPrice || '',
      stock: product.stock ?? '',
      sku: product.sku || '',
      warranty: product.warranty || '1 year',
      tags: (product.tags || []).join(', '),
      thumbnail: product.thumbnail || product.images?.[0] || '',
      images: (product.images || []).join('\n'),
      featured: !!product.featured,
      newArrival: !!product.newArrival,
      specifications: product.specifications
        ? Object.entries(
            product.specifications instanceof Map
              ? Object.fromEntries(product.specifications)
              : product.specifications
          ).map(([name, value]) => ({ id: newRowId(), name, value }))
        : [],
      variants: (product.variants || []).map((v) => ({
        id: v._id || newRowId(),
        color: v.color ?? '',
        price: v.price ?? '',
        discountPrice: v.discountPrice || '',
        stock: v.stock ?? '',
      })),
    });
    setFiles([]);
    setModal(product._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrls = [];

    if (files.length > 0) {
      try {
        setUploading(true);
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrls = data.urls || [];
      } catch (err) {
        setUploading(false);
        showToast(err.message || 'Image upload failed', 'error');
        return;
      }
    } else {
      imageUrls = form.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (!imageUrls.length) {
      showToast('Please add at least one image', 'error');
      setUploading(false);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      stock: Number(form.stock),
      sku: form.sku,
      warranty: form.warranty,
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      thumbnail: form.thumbnail.trim() || imageUrls[0],
      images: imageUrls,
      featured: form.featured,
      newArrival: form.newArrival,
    };

    if (modal !== 'create' || form.specifications.length > 0) {
      payload.specifications = Object.fromEntries(
        form.specifications
          .filter((item) => item.name?.trim() && item.value?.trim())
          .map((item) => [item.name.trim(), item.value.trim()])
      );
    }

    const variantRows = form.variants.filter((v) => v.color?.trim());
    if (variantRows.length > 0) {
      for (const v of variantRows) {
        const price = Number(v.price);
        const stock = Number(v.stock);
        if (!Number.isFinite(price) || price < 0) {
          showToast(`Enter a valid price for color "${v.color.trim()}"`, 'error');
          return;
        }
        const discount = hasValue(v.discountPrice) ? Number(v.discountPrice) : 0;
        if (!Number.isFinite(discount) || discount < 0 || (discount > 0 && discount >= price)) {
          showToast(`Discount for color "${v.color.trim()}" must be a number lower than its price`, 'error');
          return;
        }
        if (!Number.isFinite(stock) || stock < 0) {
          showToast(`Enter a valid stock quantity for color "${v.color.trim()}"`, 'error');
          return;
        }
      }
      const colorNames = variantRows.map((v) => v.color.trim().toLowerCase());
      const firstDuplicate = colorNames.find((c, i) => colorNames.indexOf(c) !== i);
      if (firstDuplicate) {
        showToast(`Duplicate color variant: "${firstDuplicate}"`, 'error');
        return;
      }
    }
    payload.variants = variantRows.map((v) => ({
      color: v.color.trim(),
      price: Number(v.price),
      discountPrice: Number(v.discountPrice) > 0 ? Number(v.discountPrice) : null,
      stock: Number(v.stock),
    }));

    try {
      if (modal === 'create') {
        await api.post('/products', payload);
        showToast('Product created');
      } else {
        await api.put(`/products/${modal}`, payload);
        showToast('Product updated');
      }
      setModal(null);
      setFiles([]);
      setUploading(false);
      fetchProducts();
    } catch (err) {
      setUploading(false);
      showToast(err.message, 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product deleted', 'info');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button type="button" onClick={openCreate} className="btn-primary">
          <FiPlus /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail || p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="line-clamp-1 font-medium">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">{p.category}</td>
                  <td className="p-4">
                    {p.variants?.length > 0 ? (
                      <span title={p.variants.map((v) => `${v.color}: ${formatPrice(v.price)}`).join(', ')}>
                        From {formatPrice(Math.min(...p.variants.map((v) => v.price)))}
                      </span>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className="p-4">
                    {p.variants?.length > 0
                      ? `${p.variants.reduce((sum, v) => sum + v.stock, 0)} (${p.variants.length} colors)`
                      : p.stock}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(p)} className="btn-ghost p-2">
                        <FiEdit2 />
                      </button>
                      <button type="button" onClick={() => deleteProduct(p._id)} className="btn-ghost p-2 text-red-500">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="text-lg font-bold">{modal === 'create' ? 'Add' : 'Edit'} Product</h2>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {['title', 'brand'].map((field) => (
                  <div key={field}>
                    <label className="text-sm font-medium capitalize">{field}</label>
                    <input
                      required
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field mt-1"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {['price', 'discountPrice', 'stock'].map((field) => (
                  <div key={field}>
                    <label className="text-sm font-medium capitalize">{field}</label>
                    <input
                      type="number"
                      required={field !== 'discountPrice'}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Warranty</label>
                  <input
                    value={form.warranty}
                    onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Thumbnail image URL</label>
                <input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Upload images from device</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="mt-1 block w-full text-sm"
                />
                {files.length > 0 && <p className="mt-2 text-xs text-slate-500">Selected {files.length} image(s)</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Image URLs (one per line)</label>
                <textarea
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  className="input-field mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Specifications</label>
                <div className="mt-2 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  {form.specifications.map((item, index) => (
                    <div key={item.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const next = [...form.specifications];
                          next[index] = { ...next[index], name: e.target.value };
                          setForm({ ...form, specifications: next });
                        }}
                        className="input-field"
                        placeholder="Specification name"
                      />
                      <input
                        value={item.value}
                        onChange={(e) => {
                          const next = [...form.specifications];
                          next[index] = { ...next[index], value: e.target.value };
                          setForm({ ...form, specifications: next });
                        }}
                        className="input-field"
                        placeholder="Specification value"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, specifications: form.specifications.filter((_, i) => i !== index) })}
                        className="btn-ghost text-red-500"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, specifications: [...form.specifications, { id: newRowId(), name: '', value: '' }] })}
                    className="btn-ghost mt-1"
                  >
                    <FiPlus /> Add specification
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Color Variants (optional)</label>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Add a color only if this product has color options with their own price/stock. Leave empty for a regular single-price product. A color with no Discount of its own uses the product discount when its price matches the product price.
                </p>
                <div className="mt-2 space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  {form.variants.map((v, index) => (
                    <div key={v.id} className="grid gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-800 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
                      <input
                        value={v.color}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[index] = { ...next[index], color: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="input-field"
                        placeholder="Color name (e.g. Black)"
                      />
                      <input
                        type="number"
                        min="0"
                        value={v.price}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[index] = { ...next[index], price: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="input-field"
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        min="0"
                        value={v.discountPrice}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[index] = { ...next[index], discountPrice: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="input-field"
                        placeholder="Discount"
                      />
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[index] = { ...next[index], stock: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="input-field"
                        placeholder="Stock"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) })}
                        className="btn-ghost text-red-500"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, variants: [...form.variants, { id: newRowId(), color: '', price: form.price || '', discountPrice: '', stock: '' }] })}
                    className="btn-ghost mt-1"
                  >
                    <FiPlus /> Add Color
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured product
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.newArrival}
                    onChange={(e) => setForm({ ...form, newArrival: e.target.checked })}
                  />
                  New arrival
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
