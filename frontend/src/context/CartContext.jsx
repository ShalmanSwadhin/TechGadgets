import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getEffectivePrice } from '../utils/format';

const CartContext = createContext(null);
const GUEST_KEY = 'techgadgets_guest_cart';

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
      const populated = (data.cart?.items || [])
        .filter((i) => i.product)
        .map((i) => ({
          product: i.product,
          quantity: i.quantity,
        }));
      setItems(populated);
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

  const saveGuestCart = (newItems) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(newItems));
    setItems(newItems);
  };

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

  const addToCart = async (product, qty = 1) => {
    if (isAuthenticated) {
      try {
        const { data } = await api.post('/cart', { productId: product._id, quantity: qty });
        const populated = (data.cart?.items || [])
          .filter((i) => i.product)
          .map((i) => ({ product: i.product, quantity: i.quantity }));
        setItems(populated);
        showToast('Added to cart');
        openCart();
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      const existing = items.find((i) => i.product._id === product._id);
      let newItems;
      if (existing) {
        newItems = items.map((i) =>
          i.product._id === product._id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        newItems = [...items, { product, quantity: qty }];
      }
      saveGuestCart(newItems);
      showToast('Added to cart');
      openCart();
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (isAuthenticated) {
      try {
        const { data } = await api.put('/cart', { productId, quantity });
        const populated = (data.cart?.items || [])
          .filter((i) => i.product)
          .map((i) => ({ product: i.product, quantity: i.quantity }));
        setItems(populated);
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      const newItems =
        quantity < 1
          ? items.filter((i) => i.product._id !== productId)
          : items.map((i) =>
              i.product._id === productId ? { ...i, quantity } : i
            );
      saveGuestCart(newItems);
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const { data } = await api.delete(`/cart/${productId}`);
        const populated = (data.cart?.items || [])
          .filter((i) => i.product)
          .map((i) => ({ product: i.product, quantity: i.quantity }));
        setItems(populated);
        showToast('Removed from cart', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      saveGuestCart(items.filter((i) => i.product._id !== productId));
      showToast('Removed from cart', 'info');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await api.delete('/cart/clear');
    } else {
      localStorage.removeItem(GUEST_KEY);
    }
    setItems([]);
  };

  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + getEffectivePrice(i.product) * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
