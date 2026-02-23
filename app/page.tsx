"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#8B1A1A] rounded-full flex items-center justify-center text-white font-serif font-bold text-xl">
            D
          </div>
          <span className="text-2xl font-serif font-bold text-[#8B1A1A] tracking-tight">DIBA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/reserve" className="hover:text-[#8B1A1A] transition-colors">Reservations</Link>
          <Link href="#about" className="hover:text-[#8B1A1A] transition-colors">Our Story</Link>
          <Link href="#menu" className="hover:text-[#8B1A1A] transition-colors">Menu</Link>
          <Link href="/admin/login" className="px-4 py-2 border border-[#C4973A] text-[#C4973A] rounded-lg hover:bg-[#C4973A] hover:text-white transition-all">Staff Portal</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-12 md:px-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-block px-4 py-1.5 bg-red-50 text-[#8B1A1A] rounded-full text-xs font-bold tracking-widest uppercase">
            Authentic Persian Cuisine
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight text-[#8B1A1A]">
            A Taste of <br />
            <span className="text-[#C4973A]">Heritage.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
            Experience the rich flavors and time-honored traditions of Persia in the heart of Montreal.
            From our saffron-infused rice to succulents kebabs, every dish is a celebration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/reserve" className="btn-primary text-center px-10 py-4 text-lg">
              Book a Table
            </Link>
            <Link href="#menu" className="btn-outline text-center px-10 py-4 text-lg">
              Explore Menu
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-[#C4973A] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity rounded-[3rem]"></div>
          <div className="relative h-[500px] w-full bg-[#8B1A1A] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B1A1A] via-[#6B1414] to-black flex items-center justify-center p-12 text-center">
              <div className="space-y-4">
                <span className="block text-6xl">🥘</span>
                <p className="text-white/60 font-serif italic text-lg uppercase tracking-widest">Est. 1998 — Montreal</p>
                <h3 className="text-white text-3xl font-serif font-bold">Diba Somerled</h3>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32"></div>
          </div>
        </motion.div>
      </section>

      {/* Info Section */}
      <section className="bg-white py-20 px-8 md:px-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#8B1A1A] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="text-xl font-bold">Opening Hours</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Tuesday – Sunday<br />
              11:30 AM – 10:00 PM<br />
              Closed Mondays
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#8B1A1A] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h4 className="text-xl font-bold">Location</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              5617 Somerled Ave<br />
              Montreal, QC H3W 2W6<br />
              (514) 485-9999
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#8B1A1A] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h4 className="text-xl font-bold">Reservations</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Secure your table online.<br />
              Parties over 14 require a deposit.<br />
              Walk-ins always welcome.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAF7F2] py-12 px-8 md:px-16 text-center border-t border-gray-100">
        <p className="text-gray-400 text-xs tracking-widest uppercase">© 2026 Diba Restaurant Montreal. All rights reserved.</p>
      </footer>
    </div>
  );
}
