import { checkUser } from "@/lib/checkUser";
import { checkAndAllocateCredits } from "@/actions/credits";
import HeaderActions from "@/components/header-actions";
import { Stethoscope, Pill } from "lucide-react";
import Link from "next/link";
import React from "react";

const Header = async () => {
  let user = await checkUser();
  if (user?.role === "PATIENT") {
    const updatedUser = await checkAndAllocateCredits(user);
    if (updatedUser) user = updatedUser;
  }

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Professional Tech-Health "C" SVG Logo */}
            <svg 
              width="38" 
              height="38" 
              viewBox="0 0 40 40" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="transition-transform group-hover:scale-105 duration-300 drop-shadow-sm"
            >
              <path 
                d="M28 12C26.5 9 23.5 7 20 7C12.8 7 7 12.8 7 20C7 27.2 12.8 33 20 33C23.5 33 26.5 31 28 28" 
                stroke="url(#paint0_linear)" 
                strokeWidth="5.5" 
                strokeLinecap="round"
              />
              <circle cx="28" cy="20" r="4.5" fill="#22d3ee" className="animate-pulse" />
              <defs>
                <linearGradient id="paint0_linear" x1="7" y1="7" x2="28" y2="33" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0d9488"/>
                  <stop offset="1" stopColor="#0891b2"/>
                </linearGradient>
              </defs>
            </svg>
          </Link>

          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/doctors"
              className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Stethoscope className="h-4 w-4 text-teal-400" />
              Find Doctors
            </Link>
            <Link
              href="/medicines"
              className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Pill className="h-4 w-4 text-teal-400" />
              Medicines (Dukaan)
            </Link>
          </div>
        </div>

        <HeaderActions user={user} />
      </nav>
    </header>
  );
};

export default Header;
