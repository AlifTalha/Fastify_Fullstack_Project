import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold text-white">MyStore</p>
            <p className="mt-3 text-sm leading-relaxed">
              Your one-stop shop for amazing products and interesting articles.
              Quality you can trust.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Shop
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["All Products", "/shop"],
                ["Orders", "/orders"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link
                    to={h}
                    className="transition hover:text-white no-underline"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Blog
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Latest Posts", "/blog"],
                ["Write a Post", "/blog/new"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link
                    to={h}
                    className="transition hover:text-white no-underline"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Account
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Login", "/login"],
                ["Register", "/register"],
                ["Profile", "/profile"],
                ["Support", "/tickets"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link
                    to={h}
                    className="transition hover:text-white no-underline"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} MyStore. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="cursor-default transition hover:text-white">
              Privacy Policy
            </span>
            <span className="cursor-default transition hover:text-white">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      {/* Footer is built into HomePage; show the shared footer for all other pages */}
      {!isHome && <SiteFooter />}
    </>
  );
}
