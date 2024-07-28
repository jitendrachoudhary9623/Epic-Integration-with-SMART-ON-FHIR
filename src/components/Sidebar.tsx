'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from 'react-icons';
import { HiOutlineHome, HiOutlineCalendar, HiOutlineUser, HiOutlineChartBar, HiOutlineUserGroup, HiOutlineCurrencyDollar } from 'react-icons/hi';
import { FiChevronLeft, FiChevronRight, FiHelpCircle, FiSettings, FiLifeBuoy, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface NavItem {
  name: string;
  href: string;
  icon: IconType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HiOutlineHome },
  { name: 'Calendar', href: '/calendar', icon: HiOutlineCalendar },
  {
    name: 'Patient', href: '/patients', icon: HiOutlineUser,
    // children: [
    //   { name: 'List', href: '/patients/list', icon: HiOutlineUser },
    //   { name: 'Profile', href: '/patients/profile', icon: HiOutlineUser }
    // ]
  },
  { name: 'Reports', href: '/reports', icon: HiOutlineChartBar },
  {
    name: 'CRM', href: '/crm', icon: HiOutlineUserGroup,
    children: [
      { name: 'Leads', href: '/crm/leads', icon: HiOutlineUserGroup },
      { name: 'Opportunities', href: '/crm/opportunities', icon: HiOutlineUserGroup }
    ]
  },
  { name: 'Accounts', href: '/accounts', icon: HiOutlineCurrencyDollar },
];

const Sidebar: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleItem = (name: string) => {
    setOpenItems(openItems.includes(name) ? openItems.filter(item => item !== name) : [...openItems, name]);
  };

  return (
    <aside className={`bg-white text-gray-700 h-screen ${expanded ? 'w-48' : 'w-16'} transition-all duration-300 ease-in-out border-r border-gray-300`}>
      <div className="flex flex-col h-full">
        
        {/* Organization Details */}
        <div className="flex items-center justify-between p-2 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/nirmitee-io/image/upload/v1655041769/nirmitee/xxxx_j1pv5b-removebg-preview_eo2qqp.png" alt="OrgLogo" className="w-6 h-6 mr-2" />
            {expanded && <span className="font-bold text-sm">Nirmitee.io</span>}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg bg-gray-200 hover:bg-gray-300">
            {expanded ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
          </button>
        </div>
        
        {/* Logged-in User Details */}
        <div className="flex items-center p-2 bg-white border-b border-gray-200">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSLU5_eUUGBfxfxRd4IquPiEwLbt4E_6RYMw&s" alt="User" className="w-8 h-8 rounded-full mr-2" />
          {expanded && (
            <div>
              <p className="font-semibold text-sm">Emma Oliva</p>
              <p className="text-xs text-gray-500">em@gmail.com</p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow">
          <ul className="space-y-1 px-1 mt-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <div className={`flex items-center justify-between p-2 rounded-lg ${pathname === item.href ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                  <Link href={item.href} passHref>
                    <span className="flex items-center">
                      <item.icon className={`w-5 h-5 ${expanded ? 'mr-2' : 'mx-auto'}`} />
                      {expanded && <span className="text-sm">{item.name}</span>}
                    </span>
                  </Link>
                  {item.children && expanded && (
                    <button onClick={() => toggleItem(item.name)} className="p-1 rounded-lg hover:bg-gray-200">
                      {openItems.includes(item.name) ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </button>
                  )}
                </div>
                {item.children && openItems.includes(item.name) && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.name}>
                        <Link href={child.href} passHref>
                          <span className={`flex items-center p-2 rounded-lg ${pathname === child.href ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                            <child.icon className={`w-4 h-4 ${expanded ? 'mr-2' : 'mx-auto'}`} />
                            {expanded && <span className="text-sm">{child.name}</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Help, Settings, and Support Links */}
        <div className="flex flex-col space-y-1 p-2 border-t border-gray-200">
          <Link href="/help" passHref>
            <span className={`flex items-center p-2 rounded-lg hover:bg-gray-100`}>
              <FiHelpCircle className={`w-5 h-5 ${expanded ? 'mr-2' : 'mx-auto'}`} />
              {expanded && <span className="text-sm">Help</span>}
            </span>
          </Link>
          <Link href="/settings" passHref>
            <span className={`flex items-center p-2 rounded-lg hover:bg-gray-100`}>
              <FiSettings className={`w-5 h-5 ${expanded ? 'mr-2' : 'mx-auto'}`} />
              {expanded && <span className="text-sm">Settings</span>}
            </span>
          </Link>
          <Link href="/support" passHref>
            <span className={`flex items-center p-2 rounded-lg hover:bg-gray-100`}>
              <FiLifeBuoy className={`w-5 h-5 ${expanded ? 'mr-2' : 'mx-auto'}`} />
              {expanded && <span className="text-sm">Support</span>}
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
