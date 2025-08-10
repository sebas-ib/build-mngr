"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldFadeIn, setShouldFadeIn] = useState(false);

  // Handle scroll lock + fade-in trigger
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("overflow-hidden");
      setIsVisible(true); // mount the component

      // wait for next tick to trigger fade-in
      setTimeout(() => {
        setShouldFadeIn(true);
      }, 10); // short delay to ensure render cycle
    } else {
      document.body.classList.remove("overflow-hidden");
      setShouldFadeIn(false); // start fade-out

      // unmount after fade-out ends
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 500); // match your transition-duration

      return () => clearTimeout(timeout);
    }

    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/10">
        <div className="flex justify-center items-center py-2 bg-black text-white text-xs sm:text-sm">
          <p>Get started today — Manage your projects smarter!</p>
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 z-50">
            BuildManager
          </h1>
          <nav className="hidden sm:flex gap-6 text-sm text-gray-600 items-center">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
            <button
              className="btn btn-primary"
              onClick={() => {
                setMenuOpen(false);
                window.location.href = "http://localhost:5000/api/login";
              }}
            >
              Log In
            </button>
          </nav>
          <div className="sm:hidden z-50">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-800"
              aria-label="toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isVisible && (
        <div
          className={`fixed inset-0 z-40 bg-white h-screen px-6 pt-30 pb-10 flex flex-col transition-opacity duration-500 ${
            shouldFadeIn ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4 text-xl font-semibold text-gray-800">
            <a href="#features" onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <a href="#contact" onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">
              Contact
            </a>
          </div>
          <div className="mt-auto">
            <button
              className="btn btn-primary w-full"
              onClick={() => {
                setMenuOpen(false);
                window.location.href = "http://localhost:5000/api/login";
              }}
            >
              Log In
            </button>
          </div>
        </div>
      )}
    </>
  );
};
