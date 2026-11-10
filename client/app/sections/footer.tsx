import Link from "next/link";
import { Cpu } from "lucide-react";

const footerGroups = [
  { title: "Shop", links: [{ label: "All Products", href: "/product" }, { label: "Categories", href: "/#best-offers" }, { label: "New Arrivals", href: "/product" }, { label: "Special Offers", href: "/product" }] },
  { title: "Company", links: [{ label: "About Us", href: "/#about" }, { label: "Careers", href: "mailto:careers@mountblack.com" }, { label: "Contact", href: "mailto:support@mountblack.com" }] },
  { title: "Resources", links: [{ label: "Help Center", href: "mailto:support@mountblack.com" }, { label: "Buying Guide", href: "/product" }, { label: "FAQs", href: "mailto:support@mountblack.com" }] },
  { title: "Support", links: [{ label: "Customer Support", href: "mailto:support@mountblack.com" }, { label: "Shipping", href: "mailto:support@mountblack.com" }, { label: "Returns", href: "mailto:support@mountblack.com" }] },
  { title: "Policies", links: [{ label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" }, { label: "Refund Policy", href: "/returns" }] },
  { title: "Contact", links: [{ label: "Get in touch", href: "mailto:support@mountblack.com" }, { label: "Support email", href: "mailto:support@mountblack.com" }] },
];

export default function Footer() {
  return (
    <footer className="bg-[#f4f5f6] px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
      <div className="relative isolate overflow-hidden rounded-[34px] bg-[#2d3436] px-6 pb-9 pt-28 text-white sm:rounded-[46px] sm:px-10 sm:pb-12 sm:pt-32 lg:px-16">
        <svg aria-hidden="true" viewBox="0 0 1600 110" preserveAspectRatio="none" className="absolute inset-x-0 top-0 z-0 h-24 w-full sm:h-28">
          <path fill="#f4f5f6" d="M0 0h1600v26c-102 32-171 40-270 11-102-30-160-22-259 6-123 35-185 41-296 5-118-38-192-32-314-5C322 72 251 62 143 23 88 3 42 11 0 30V0Z" />
        </svg>

        <div className="relative z-10 mx-auto max-w-[1320px]">
          <div className="mb-11 flex flex-col justify-between gap-7 sm:mb-12 sm:flex-row sm:items-center">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#9b8bf4] text-[#25233b]"><Cpu className="size-7" /></span>
              <span><span className="block text-lg font-bold tracking-tight">MAB<span className="font-normal text-[#c7a331]">RUK</span></span><span className="mt-0.5 block text-sm text-white/60">© {new Date().getFullYear()} Mabruk. All rights reserved.</span></span>
            </Link>
            <div className="flex items-center gap-5 text-[#d3ad4a]" aria-label="Social media">
              <a href="https://facebook.com" aria-label="Facebook" className="text-lg font-bold transition hover:text-white">f</a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="text-sm font-bold transition hover:text-white">in</a>
              <a href="https://threads.net" aria-label="Threads" className="text-lg font-bold transition hover:text-white">@</a>
              <a href="https://twitter.com" aria-label="Twitter" className="text-lg font-bold transition hover:text-white">𝕏</a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8">
            {footerGroups.map((group) => <div key={group.title}>
              <h2 className="mb-4 text-sm font-bold text-[#39d5b0] sm:text-base">{group.title}</h2>
              <ul className="space-y-3">
                {group.links.map((link) => <li key={`${group.title}-${link.label}`}><Link href={link.href} className="text-sm text-white/75 transition hover:text-white sm:text-base">{link.label}</Link></li>)}
              </ul>
            </div>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
