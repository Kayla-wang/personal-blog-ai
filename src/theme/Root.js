import React, { useEffect } from 'react';
import AIChatWidget from '@site/src/components/AIChatWidget';

export default function Root({ children }) {
  useEffect(() => {
    const sidebarKey = 'docusaurus.sidebar.hidden';
    if (localStorage.getItem(sidebarKey) === null) {
      localStorage.setItem(sidebarKey, 'true');
    }
  }, []);

  return (
    <>
      {children}
      <AIChatWidget />
    </>
  );
}
