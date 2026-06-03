import React from 'react';
import AIChatWidget from '@site/src/components/AIChatWidget';

export default function Root({ children }) {
  return (
    <>
      {children}
      <AIChatWidget />
    </>
  );
}
