export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <h3 className="font-bold text-neutral-900 text-lg mb-3">Prox</h3>
            <p className="text-neutral-600 text-sm">
              AI-powered product recommendations based on real social media trends.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-neutral-900 mb-3">Learn More</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/how-it-works" className="text-neutral-600 hover:text-oak-600">How It Works</a></li>
              <li><a href="/privacy-policy" className="text-neutral-600 hover:text-oak-600">Privacy Policy</a></li>
              <li><a href="/terms" className="text-neutral-600 hover:text-oak-600">Terms of Service</a></li>
            </ul>
          </div>

          {/* Affiliate Notice */}
          <div>
            <h4 className="font-bold text-neutral-900 mb-3">Affiliate Disclosure</h4>
            <p className="text-neutral-600 text-sm">
              As an Amazon Associate we earn from qualifying purchases. We may also earn commissions
              from other affiliate partners.
            </p>
          </div>

        </div>
        
        <div className="border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} Prox LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}