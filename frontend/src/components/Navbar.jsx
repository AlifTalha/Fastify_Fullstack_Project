import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const LOGO_URL = "/image/logo.png";

const navLinkClass = ({ isActive }) =>
  `relative text-sm font-semibold transition-colors duration-150 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:rounded-full after:bg-indigo-500 after:transition-transform after:duration-200 hover:text-indigo-600 hover:after:scale-x-100 ${
    isActive ? "text-indigo-600 after:scale-x-100" : "text-slate-600"
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-350 items-center justify-between px-6">
        {/* ── Left: Logo ─────────────────────────────────── */}
        <Link to="/" className="flex shrink-0 items-center no-underline">
          <img
            src={LOGO_URL}
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* ── Center: Nav links ───────────────────────────── */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-7">
          <NavLink to="/shop" className={navLinkClass}>
            Shop
          </NavLink>
          <NavLink to="/blog" className={navLinkClass}>
            Blog
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/chat" className={navLinkClass}>
                Chat
              </NavLink>
              <NavLink to="/tickets" className={navLinkClass}>
                Tickets
              </NavLink>
              {user?.role === "ADMIN" && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            </>
          )}

          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* ── Right: Logout / Login ───────────────────────── */}
        <div className="flex shrink-0 items-center">
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
      </div>
    </nav>
  );
}
