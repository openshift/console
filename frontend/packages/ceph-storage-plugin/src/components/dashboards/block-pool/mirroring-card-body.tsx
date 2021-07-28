import * as React from 'react';
import './mirroring-card.scss';

export const MirroringCardBody: React.FC<MirroringCardBodyProps> = ({ children }) => (
  <dl className="co-dashboard-card__body--top-margin odf-block-pool__mirroring-card-body co-dashboard-text--small">
    {children}
  </dl>
);

type MirroringCardBodyProps = {
  children: React.ReactNode;
};
