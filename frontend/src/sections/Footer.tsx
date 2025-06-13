export const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-3">BuildManager</h2>
          <p className="text-sm">
            Manage your construction projects smarter and faster. Stay organized, informed, and in control.
          </p>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-3">Navigation</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-black transition">Features</a></li>
            <li><a href="#pricing" className="hover:text-black transition">Pricing</a></li>
            <li><a href="#about" className="hover:text-black transition">About</a></li>
            <li><a href="#contact" className="hover:text-black transition">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-3">Connect with us</h3>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-black">
              <i className="fab fa-twitter" aria-hidden="true" />
            </a>
            <a href="#" className="hover:text-black">
              <i className="fab fa-linkedin" aria-hidden="true" />
            </a>
            <a href="#" className="hover:text-black">
              <i className="fab fa-github" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 text-sm text-center py-4">
        © {new Date().getFullYear()} BuildManager. All rights reserved.
      </div>
    </footer>
  );
};
