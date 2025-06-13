// frontend/src/app/login/page.tsx

import Link from "next/link";


export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">Sign In</h1>
          <Link href={"/dashboard"}>
              <button className="btn btn-primary w-full">
                  Log In
              </button>
          </Link>
      </div>
    </main>
  );
}
