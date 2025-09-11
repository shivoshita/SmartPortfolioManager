import { PieChart } from "lucide-react";
import { Link } from "wouter";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/docs", label: "Docs" }, 
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <PieChart className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-foreground">PortfolioManager</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex space-x-6">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded" 
                      data-testid={`footer-${link.label.toLowerCase()}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <p className="text-sm text-muted-foreground">
                © 2024 PortfolioManager. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground">
                Built with modern web technologies for superior performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}