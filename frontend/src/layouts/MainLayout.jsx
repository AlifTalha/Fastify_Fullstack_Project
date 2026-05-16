import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";

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
