import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' },
        { name: 'News', href: '/news' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '/blog' },
        { name: 'Newsletter', href: '/newsletter' },
        { name: 'Events', href: '/events' },
        { name: 'Help Center', href: '/help' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms', href: '/terms' },
        { name: 'Privacy', href: '/privacy' },
        { name: 'Cookies', href: '/cookies' },
        { name: 'Licenses', href: '/licenses' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-black pt-20 pb-10 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold dark:text-white">Samadhan</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-xs mb-8 leading-relaxed">
              Empowering individuals and businesses with innovative solutions for a better tomorrow.
            </p>
            <div className="flex space-x-5">
              {/* Social Icons Placeholder */}
              {[1, 2, 3, 4].map((i) => (
                <Link key={i} href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                  <span className="sr-only">Social</span>
                  <div className="w-5 h-5 border-2 border-current rounded-sm"></div>
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-sm">
                {column.title}
              </h3>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            © {currentYear} Samadhan Inc. All rights reserved.
          </p>
          <div className="flex space-x-8">
            <Link href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">English (US)</Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">Help</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
