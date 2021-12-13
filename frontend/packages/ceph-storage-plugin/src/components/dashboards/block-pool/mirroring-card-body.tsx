import * as React from 'react';
import './mirroring-card.scss';

export const MirroringCardBody: React.FC<MirroringCardBodyProps> = ({ children }) => (
  <dl className="odf-block-pool__mirroring-card-body">{children}</dl>
);

type MirroringCardBodyProps = {
  children: React.ReactNode;
};
