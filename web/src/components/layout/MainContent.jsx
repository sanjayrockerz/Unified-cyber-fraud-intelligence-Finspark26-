import React from 'react';

export default function MainContent({ children }) {
  return (
    <main className="flex-1 overflow-y-auto bg-soc-bg p-3 sm:p-4">
      {children}
    </main>
  );
}
