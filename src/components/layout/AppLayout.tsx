'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { UserSession, LeadItem } from '@/lib/types';
import { LeadFormModal } from '../leads/LeadFormModal';
import { usePathname, useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If on login page, skip fetching me
    if (pathname === '/login') {
      setIsLoadingAuth(false);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  }, [pathname, router]);

  const handleLeadCreated = (newLead: LeadItem) => {
    // Refresh page or broadcast event
    window.location.reload();
  };

  // Login page has no sidebar/navbar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Initializing XYZ College CRM...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <Sidebar
        currentUser={currentUser}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenNewLeadModal={() => setNewLeadModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>

      {/* Global Quick Lead Registration Modal */}
      <LeadFormModal
        isOpen={newLeadModalOpen}
        onClose={() => setNewLeadModalOpen(false)}
        onSuccess={handleLeadCreated}
        currentUser={currentUser}
      />
    </div>
  );
};
