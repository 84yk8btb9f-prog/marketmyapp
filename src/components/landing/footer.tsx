import Link from "next/link";
import { Zap } from "lucide-react";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "How it Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Twitter / X", href: "https://x.com" },
      { label: "Contact", href: "mailto:hello@marketmyapp.co" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity mb-4"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
                <Zap className="size-4 text-primary-foreground" />
              </div>
              <span className="text-base tracking-tight">MarketMyApp</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              Your AI marketing co-pilot for indie hackers.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.heading}>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {year} MarketMyApp. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for indie hackers, by indie hackers.
          </p>
        </div>
      </div>
    </footer>
  );
}
