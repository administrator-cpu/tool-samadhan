'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, Server, AlertCircle, Clock, UserCheck, Trash2, HelpCircle, ChevronUp } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
      // Simple scroll spy
      const sections = document.querySelectorAll('section[id]');
      let current = '';
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 120) {
          current = section.getAttribute('id') || '';
        }
      });
      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'section-1', title: '1. Introduction & Scope' },
    { id: 'section-2', title: '2. Data We Collect' },
    { id: 'section-3', title: '3. How We Use Data' },
    { id: 'section-4', title: '4. Data Sharing & Third-Party' },
    { id: 'section-5', title: '5. Data Retention' },
    { id: 'section-6', title: '6. Children\'s Privacy' },
    { id: 'section-7', title: '7. Data Security' },
    { id: 'section-8', title: '8. Contact Requests' },
    { id: 'section-9', title: '9. Policy Updates' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header Section */}
      <div className="bg-emerald-700 px-8 py-12 md:py-16 text-white flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-600 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-emerald-800 rounded-full opacity-30 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto w-full flex flex-col relative z-10">
          <Link href="/" className="inline-flex items-center text-emerald-100 hover:text-white transition-colors mb-8 self-start">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center space-x-5">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
              <Shield className="w-10 h-10 text-emerald-50" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
              <p className="text-emerald-100 mt-3 text-lg font-medium">Last updated: August 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-8xl mx-auto px-6 md:px-8 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Sticky Sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Table of Contents</h3>
            <nav className="space-y-1.5 flex flex-col">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-16">
          
          {/* 1. Introduction & Scope */}
          <section id="section-1" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 font-mono text-sm">01</div>
              <span>Introduction &amp; Scope</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg leading-relaxed text-slate-600">
                Samadhan is a customer support and ticketing platform used by <strong>Fab5Network</strong> to allow its customers to report, track, and manage issues related to their services. This Privacy Policy explains what information may be collected when you use Samadhan, how that information is used to provide support services, how it may be shared with service providers, and how it is protected. We process personal information in accordance with applicable data protection and privacy laws, including COPPA and GDPR where applicable.
              </p>
            </div>
          </section>

          {/* 2. Data We Collect */}
          <section id="section-2" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><FileText className="w-5 h-5" /></div>
              <span>Data We Collect</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <ul className="list-disc pl-5 space-y-4 text-base">
                <li><strong>Account Data:</strong> Full name, email address, phone numbers, and profile images provided during account creation or profile updates.</li>
                <li><strong>Service/Ticket Data:</strong> When raising a ticket, customers provide their circuit ID, issue category, a detailed description, and any necessary file attachments. After a ticket is resolved, customers may provide feedback ratings and comments.</li>
                <li><strong>Device &amp; Network Data:</strong> IP addresses, browser information, user-agent strings, and device push tokens.</li>
                <li><strong>Automatic Collection:</strong> Certain technical information, such as IP addresses, browser information, user-agent strings, and device identifiers or push tokens, may be collected automatically when you use Samadhan. This information is used for service operation, security, troubleshooting, and notification delivery.</li>
                <li><strong>Ephemeral Processing:</strong> Certain real-time communications, including data transmitted through WebSocket connections, may be processed temporarily in memory to facilitate real-time communication. Such data is not intentionally retained as permanent application data unless it is subsequently recorded as part of a ticket or other service record.</li>
              </ul>
            </div>
          </section>

          {/* 3. How We Use Data */}
          <section id="section-3" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><Server className="w-5 h-5" /></div>
              <span>How We Use Data</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg">We use your data for the following operational purposes:</p>
              <ul className="list-disc pl-5 space-y-3 text-base">
                <li>To create and manage your Samadhan account and support tickets.</li>
                <li>To provide real-time updates and notifications regarding your Fab5Network telecom service status.</li>
                <li>To send notifications to your registered devices regarding ticket updates.</li>
                <li>To monitor system health, improve service operation, troubleshoot issues, and prevent unauthorized access.</li>
              </ul>
            </div>
          </section>

          {/* 4. Data Sharing & Third-Party Services */}
          <section id="section-4" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><AlertCircle className="w-5 h-5" /></div>
              <span>Data Sharing &amp; Third-Party Services</span>
            </h2>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 ml-3 md:ml-11">
              <p className="text-slate-700 mb-5 text-lg">We utilize trusted third-party SDKs and APIs to facilitate our services. We share necessary data with:</p>
              <ul className="list-disc pl-5 space-y-4 text-slate-600">
                <li><strong>Cloudinary:</strong> Used for securely hosting and processing images (such as profile pictures and ticket attachments).</li>
                <li><strong>Expo:</strong> Used to deliver push notifications to mobile devices through Expo&apos;s Push Notification Service.</li>
                <li><strong>Google Cloud Translation API:</strong> Used to provide multi-language support within tickets. Text sent for translation is processed in accordance with Google&apos;s API Terms of Service.</li>
                <li><strong>Resend:</strong> Used by the backend to send transactional emails such as OTPs, account-related messages, and service notifications.</li>
              </ul>
            </div>
          </section>

          {/* 5. Data Retention */}
          <section id="section-5" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><Clock className="w-5 h-5" /></div>
              <span>Data Retention</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg">
                We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as dictated by Fab5Network&apos;s specific retention policy, unless a longer retention period is required by law. Certain ephemeral processing data, such as information temporarily used to maintain active real-time connections, is not intentionally retained as permanent application data after the relevant communication session ends, except where it is subsequently recorded as part of a ticket, service record, security record, or other legitimate operational record.
              </p>
            </div>
          </section>

          {/* 6. Children's Privacy */}
          <section id="section-6" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><Shield className="w-5 h-5" /></div>
              <span>Children&apos;s Privacy</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg">
                Samadhan is primarily a B2B support platform and is not directed toward children. The service does not intentionally provide mature or age-restricted content. We do not knowingly solicit personal information from children under 13 for purposes subject to COPPA. If we become aware that personal information covered by COPPA has been collected from a child under 13 without the required consent, we will take appropriate steps to address the information in accordance with applicable law.
              </p>
            </div>
          </section>

          {/* 7. Data Security */}
          <section id="section-7" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><Lock className="w-5 h-5" /></div>
              <span>Data Security</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg">We use technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, loss, or misuse, including:</p>
              <ul className="list-disc pl-5 space-y-3 text-base">
                <li><strong>Password Hashing:</strong> User passwords are securely hashed using Argon2. Passwords are not stored in plaintext.</li>
                <li><strong>Encryption in Transit:</strong> All communications between your device and our servers utilize HTTPS/TLS.</li>
                <li><strong>Access Control:</strong> We enforce Role-Based Access Control (RBAC).</li>
                <li><strong>Session Security:</strong> We utilize JSON Web Tokens (JWT) for session management.</li>
                <li><strong>Secure Handling:</strong> Secure protocols for handling uploaded files.</li>
              </ul>
            </div>
          </section>

          {/* 8. Contact & Privacy Requests */}
          <section id="section-8" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><HelpCircle className="w-5 h-5" /></div>
              <span>Contact &amp; Privacy Requests</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg">
                If you have any questions regarding this Privacy Policy or wish to exercise your privacy rights, please direct your request to Fab5Network through their official support channels or Data Protection Officer.
              </p>
            </div>
          </section>

          {/* 9. Policy Updates */}
          <section id="section-9" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 font-mono text-sm">09</div>
              <span>Policy Updates</span>
            </h2>
            <div className="space-y-4 text-slate-600 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-3">
              <p className="text-lg">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. The date at the top of this policy indicates when it was last revised.
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 hover:-translate-y-1 transition-all z-50 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

    </div>
  );
}
