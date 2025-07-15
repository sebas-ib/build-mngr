"use client"

import Link from "next/link";

export const Hero = () => {
  return (
    <section className="pt-40 pb-40 bg-[radial-gradient(ellipse_150%_100%_at_bottom_center,_#E0ECF8,_white_66%)]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col-reverse md:flex-row items-center gap-12 md:gap-20">
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
            Built for Builders
          </h1>
          <p className="text-lg sm:text-xl text-[#4B5563] mt-6 max-w-md mx-auto md:mx-0">
            Everything you need to manage projects in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 mt-8">
            <button
              className="btn btn-primary"
              onClick={() => {
                window.location.href = "http://localhost:5000/login";
              }}
            >
              Get Started
            </button>
            <Link href="#features">
              <button className="btn btn-outline">See How It Works</button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

