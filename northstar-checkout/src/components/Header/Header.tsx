import type React from 'react';

export const Header: React.FC = () => (
  <header className="topbar">
    <div className="brand">
      <img className="brand__mark" src="/favicon.svg" alt="" />
      <span>Northstar Payments</span>
    </div>
    <span className="badge">Synthetic demo</span>
  </header>
);
