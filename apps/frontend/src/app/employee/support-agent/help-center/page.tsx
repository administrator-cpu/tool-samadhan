"use client";

import Link from "next/link";

const articles = [
  {
    title: "How to factory reset your router",
    desc: "Step-by-step instructions to wipe your hardware settings and restore default connection configurations when experiencing severe drops.",
    tag: "Hardware",
    icon: "router",
  },
  {
    title: "Why is my internet suddenly slow?",
    desc: "Understand common causes for bandwidth throttling, peak hour congestion, and how to run an accurate diagnostic speed test.",
    tag: "Troubleshooting",
    icon: "speed",
  },
  {
    title: "Understanding your first bill",
    desc: "A breakdown of prorated charges, installation fees, and recurring monthly costs you'll see on your first invoice.",
    tag: "Billing",
    icon: "receipt_long",
  },
  {
    title: "How to check for local area outages",
    desc: "Before troubleshooting your own equipment, learn how to verify if there is a known maintenance event or outage.",
    tag: "Outages",
    icon: "wifi_off",
  },
  {
    title: "Changing your Wi-Fi password",
    desc: "Keep your network secure by updating your network name (SSID) and password via router settings.",
    tag: "Security",
    icon: "password",
  },
  {
    title: "Moving to a new address?",
    desc: "Transfer your current internet plan to a new location without losing service.",
    tag: "Account",
    icon: "move_up",
  },
];

export default function HelpPage() {
  return (
      <main className="flex-1 overflow-y-auto">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0">
          <h1 className="text-lg font-semibold">Samadhan</h1>
          <span className="material-symbols-outlined">menu</span>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

          {/* Search */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-8">
              How can we help you today?
            </h2>

            <div className="relative max-w-[720px] mx-auto">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2513ec]">
                <span className="material-symbols-outlined text-2xl">
                  search
                </span>
              </span>

              <input
                type="text"
                placeholder="Search for router setup, speed tests..."
                className="w-full h-14 md:h-16 pl-14 pr-4 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-[#2513ec] outline-none"
              />
            </div>
          </div>

          {/* Pills */}
          <div className="flex overflow-x-auto gap-3 mb-10 pb-2">
            {["All Topics", "Wi-Fi & Connection", "Billing & Payments", "Hardware Setup", "Outages"].map((item, i) => (
              <button
                key={item}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium ${
                  i === 0
                    ? "bg-[#2513ec] text-white"
                    : "bg-white border border-slate-100 hover:bg-indigo-50 hover:text-[#2513ec]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Grid (NOT masonry — see note below) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-6 border border-slate-50 shadow-sm hover:-translate-y-1 hover:shadow-lg transition">
                <div className="flex justify-between mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-50 text-[#2513ec]">
                    <span className="material-symbols-outlined">{a.icon}</span>
                  </div>
                  <span
                      className=" inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium tracking-tight text-slate-600 whitespace-nowrap transition-colors hover:bg-slate-100">
                    {a.tag}
                  </span>
                </div>

                <h3 className="font-semibold mb-2">{a.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{a.desc}</p>

                <div className="text-[#2513ec] text-sm font-medium flex items-center">
                  Read article
                  <span className="material-symbols-outlined text-sm ml-1">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 pb-20">
            <p className="text-slate-500 mb-4">
              Can't find what you're looking for?
            </p>

            <Link
              href="/customer/raise-issue"
              className="inline-flex px-6 py-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
            >
              Create a Support Ticket
            </Link>
          </div>
        </div>
      </main>
  );
}