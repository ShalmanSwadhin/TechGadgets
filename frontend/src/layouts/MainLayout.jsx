import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import CartDrawer from '../components/cart/CartDrawer';
import { useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function MainLayout() {
  const { pathname } = useLocation();
  const { closeCart } = useCart();

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <CartDrawer />
    </div>
  );
}
