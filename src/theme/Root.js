import React, { useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AIChatWidget from '@site/src/components/AIChatWidget';

export default function Root({ children }) {
  const { siteConfig } = useDocusaurusContext();
  const enableChat = siteConfig.customFields?.enableChat !== false;

  useEffect(() => {
    const sidebarKey = 'docusaurus.sidebar.hidden';
    if (localStorage.getItem(sidebarKey) === null) {
      localStorage.setItem(sidebarKey, 'true');
    }
  }, []);

  return (
    <>
      {children}
      {enableChat && <AIChatWidget />}
    </>
  );
}
