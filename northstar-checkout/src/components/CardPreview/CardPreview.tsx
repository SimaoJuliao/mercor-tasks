import type React from 'react';

export const CardPreview: React.FC = () => (
  <div className="card-preview" aria-label="Synthetic test card ending in 0000">
    <span className="card-preview__chip" aria-hidden="true" />
    <div>
      <p className="card-preview__number">•••• •••• •••• 0000</p>
      <p className="muted">Synthetic test card · Expires 12/30</p>
    </div>
  </div>
);
