"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(30,30,46,0.8)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, #7c6af7, #e879f9)",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            G
          </div>
          <span
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}
            className="text-white"
          >
            ghaivert
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: "#1e1e2e", color: "#7c6af7", border: "1px solid #2a2a3e", fontFamily: "'DM Mono', monospace", fontSize: 10 }}
          >
            beta
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {[
            { href: "/", label: "Home" },
            { href: "/convert", label: "Convert" },
            { href: "/about", label: "About" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: path === href ? "#e2e2f0" : "#6060a0",
                background: path === href ? "#1e1e2e" : "transparent",
                fontWeight: path === href ? 500 : 400,
              }}
            >
              {label}
            </Link>
          ))}

          {/* CTA */}
          <Link
            href="/convert"
            className="ml-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7c6af7, #e879f9)",
              color: "white",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Start Converting
          </Link>
        </nav>
      </div>
    </header>
  );
}
