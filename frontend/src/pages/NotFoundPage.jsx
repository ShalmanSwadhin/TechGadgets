import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-8xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn-primary mt-8">Go Home</Link>
    </div>
  );
}
