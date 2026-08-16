import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getLinePrice } from '../utils/format';

const CartContext = createContext(null);
const GUEST_KEY = 'techgadgets_guest_cart';

// Pure mapper for a populated server cart → local item shape.
const mapServerCart = (cart) =>
  (cart?.items || [])
    .filter((i) => i.product)
    .map((i) => ({ product: i.product, quantity: i.quantity, color: i.color || undefined }));

// A cart line item is identified by product + color together (the same
// product in two colors are two separate lines); products without variants
// simply never carry a color, so this collapses back to the old
// product-only identity for every existing cart.
const sameLine = (item, productId, color) =>
  item.product._id === productId && (item.color || undefined) === (color || undefined);

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const lastFocusedElementRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadGuestCart = () => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setItems(mapServerCart(data.cart));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      const syncGuestCart = async () => {
        try {
          const raw = localStorage.getItem(GUEST_KEY);
          const guestItems = raw ? JSON.parse(raw) : [];
          if (guestItems.length > 0) {
            for (const item of guestItems) {
              if (item.product?._id) {
                await api.post('/cart', {
                  productId: item.product._id,
                  quantity: item.quantity,
                  color: item.color,
                });
              }
            }
            localStorage.removeItem(GUEST_KEY);
          }
        } catch {
          /* guest sync is best-effort */
        }
        fetchCart();
      };
      syncGuestCart();
    } else {
      loadGuestCart();
    }
  }, [isAuthenticated, authLoading, fetchCart]);

  // Persist the guest cart whenever it changes (guest only). This lets every
  // guest mutation use a pure functional state update — the click always
  // applies to the latest committed state, so the first click can never be
  // clobbered by a stale closure or a competing render.
  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  }, [items, isAuthenticated, authLoading]);

  const openCart = useCallback(() => {
    lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDrawerOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setDrawerOpen(false);
    requestAnimationFrame(() => {
      lastFocusedElementRef.current?.focus?.();
    });
  }, []);

  const toggleCart = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    closeCart();
  }, [location.pathname, closeCart]);

  // Guards a server add from firing twice on a rapid double-click, which would
  // otherwise create a duplicate/incorrect quantity on the backend.
  const addingRef = useRef(false);

  const addToCart = useCallback(
    async (product, qty = 1, color = undefined) => {
      if (isAuthenticated) {
        if (addingRef.current) return;
        addingRef.current = true;
        try {
          const { data } = await api.post('/cart', { productId: product._id, quantity: qty, color });
          setItems(mapServerCart(data.cart));
          showToast('Added to cart');
          openCart();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          addingRef.current = false;
        }
        return;
      }
      // Guest: functional update guarantees we build on the latest state.
      setItems((prev) => {
        const existing = prev.find((i) => sameLine(i, product._id, color));
        return existing
          ? prev.map((i) =>
              sameLine(i, product._id, color) ? { ...i, quantity: i.quantity + qty } : i
            )
          : [...prev, { product, quantity: qty, color }];
      });
      showToast('Added to cart');
      openCart();
    },
    [isAuthenticated, showToast, openCart]
  );

  const removeFromCart = useCallback(
    async (productId, color = undefined) => {
      if (isAuthenticated) {
        try {
          const { data } = await api.delete(`/cart/${productId}`, { params: color ? { color } : undefined });
          setItems(mapServerCart(data.cart));
          showToast('Removed from cart', 'info');
        } catch (err) {
          showToast(err.message, 'error');
        }
        return;
      }
      setItems((prev) => prev.filter((i) => !sameLine(i, productId, color)));
      showToast('Removed from cart', 'info');
    },
    [isAuthenticated, showToast]
  );

  const updateQuantity = useCallback(
    async (productId, quantity, color = undefined) => {
      if (isAuthenticated) {
        // Decrementing to zero means "remove" — the server rejects quantity
        // < 1 on the update endpoint, so route this through removeFromCart
        // instead of surfacing a confusing "quantity must be at least 1"
        // error (guests already got this right below).
        if (quantity < 1) {
          await removeFromCart(productId, color);
          return;
        }
        try {
          const { data } = await api.put('/cart', { productId, quantity, color });
          setItems(mapServerCart(data.cart));
        } catch (err) {
          showToast(err.message, 'error');
        }
        return;
      }
      setItems((prev) =>
        quantity < 1
          ? prev.filter((i) => !sameLine(i, productId, color))
          : prev.map((i) => (sameLine(i, productId, color) ? { ...i, quantity } : i))
      );
    },
    [isAuthenticated, showToast, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      await api.delete('/cart/clear');
    } else {
      localStorage.removeItem(GUEST_KEY);
    }
    setItems([]);
  }, [isAuthenticated]);

  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + getLinePrice(i.product, i.color) * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      drawerOpen,
      openCart,
      closeCart,
      toggleCart,
    }),
    [
      items,
      loading,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      drawerOpen,
      openCart,
      closeCart,
      toggleCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
