import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const LOGO_URL = "/image/logo.png";

const desktopNavLinkClass = ({ isActive }) =>
  `relative text-sm font-semibold transition-colors duration-150 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:rounded-full after:bg-indigo-500 after:transition-transform after:duration-200 hover:text-indigo-600 hover:after:scale-x-100 ${
    isActive ? "text-indigo-600 after:scale-x-100" : "text-slate-600"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-semibold no-underline transition-colors ${
    isActive
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-350 items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center no-underline"
          onClick={closeMobileMenu}
        >
          <img
            src={LOGO_URL}
            alt="Logo"
            className="h-9 w-auto object-contain sm:h-10"
          />
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-6 lg:gap-7 md:flex">
          <NavLink to="/shop" className={desktopNavLinkClass}>
            Shop
          </NavLink>
          <NavLink to="/blog" className={desktopNavLinkClass}>
            Blog
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/chat" className={desktopNavLinkClass}>
                Chat
              </NavLink>
              <NavLink to="/tickets" className={desktopNavLinkClass}>
                Tickets
              </NavLink>
              {user?.role === "ADMIN" && (
                <NavLink to="/admin" className={desktopNavLinkClass}>
                  Admin
                </NavLink>
              )}
              <NavLink to="/profile" className={desktopNavLinkClass}>
                Profile
              </NavLink>
            </>
          )}

          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={desktopNavLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={desktopNavLinkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>

        <div className="ml-auto hidden shrink-0 items-center md:flex">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-indigo-700"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="ml-auto inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
          aria-label={
            isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 px-4 py-3 sm:px-6">
          <NavLink
            to="/shop"
            className={mobileNavLinkClass}
            onClick={closeMobileMenu}
          >
            Shop
          </NavLink>
          <NavLink
            to="/blog"
            className={mobileNavLinkClass}
            onClick={closeMobileMenu}
          >
            Blog
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/chat"
                className={mobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                Chat
              </NavLink>
              <NavLink
                to="/tickets"
                className={mobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                Tickets
              </NavLink>
              {user?.role === "ADMIN" && (
                <NavLink
                  to="/admin"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  Admin
                </NavLink>
              )}
              <NavLink
                to="/profile"
                className={mobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                Profile
              </NavLink>
            </>
          )}

          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
                className={mobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={mobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                Register
              </NavLink>
            </>
          )}

          <div className="pt-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="block w-full rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white no-underline transition hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
