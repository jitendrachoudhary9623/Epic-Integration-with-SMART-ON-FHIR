'use client'

import React, { useState } from 'react';
import { HiSearch, HiChevronDown, HiBell, HiQuestionMarkCircle, HiDocumentDuplicate } from 'react-icons/hi';
import { Menu, Transition } from '@headlessui/react';

const TopBar: React.FC = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <div className="bg-white shadow-md p-2 flex justify-between items-center">
      {/* Left Side: Improved Logo and Title */}
      <div className="flex items-center space-x-4">
        <div className="shrink-0">
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Patient App</h1>
      </div>

      {/* Right Side: Enhanced Functionality */}
      <div className="flex items-center space-x-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        {/* Documentation Link */}
        <button className="text-gray-600 hover:text-gray-800" aria-label="Documentation">
          <HiDocumentDuplicate className="w-5 h-5" />
        </button>

        {/* Help Icon */}
        <button className="text-gray-600 hover:text-gray-800" aria-label="Help">
          <HiQuestionMarkCircle className="w-5 h-5" />
        </button>

        {/* Notification Icon */}
        <button className="text-gray-600 hover:text-gray-800 relative" aria-label="Notifications">
          <HiBell className="w-5 h-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* Profile Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-2 focus:outline-none">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSLU5_eUUGBfxfxRd4IquPiEwLbt4E_6RYMw&s" alt="Profile" className="w-8 h-8 rounded-full" />
            <HiChevronDown className="text-gray-600 w-4 h-4" />
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a href="#" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a href="#" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a href="#" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                      Sign out
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default TopBar;
