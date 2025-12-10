/**
 * Footer Component with Tally Form Links
 */

import { MessageSquare, Mail, Lightbulb } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">PropEquityLab</h3>
            <p className="text-sm text-muted-foreground">
              Analyze and grow your property portfolio with powerful insights and forecasting tools.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/properties" className="text-muted-foreground hover:text-primary transition-colors">
                  Properties
                </a>
              </li>
              <li>
                <a href="/comparison" className="text-muted-foreground hover:text-primary transition-colors">
                  Comparison
                </a>
              </li>
              <li>
                <a href="/subscription" className="text-muted-foreground hover:text-primary transition-colors">
                  Subscription
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Feedback */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Get in Touch</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://tally.so/r/rj5Ly2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://tally.so/r/NprY5O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Feedback
                </a>
              </li>
              <li>
                <a
                  href="https://tally.so/r/eqM2Zl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  Request Feature
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://tally.so/r/pbrWx8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Get Started
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} PropEquityLab. All rights reserved. Built with ❤️ for property investors.
          </p>
        </div>
      </div>
    </footer>
  );
}
