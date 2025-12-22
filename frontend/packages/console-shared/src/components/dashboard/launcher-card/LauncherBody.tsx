import type { ReactNode } from 'react';

import './launcher-card.scss';

interface LauncherBodyProps {
  children?: ReactNode;
}

const LauncherBody: React.FCC<LauncherBodyProps> = ({ children }) => (
  <div className="co-launcher-card__body">{children}</div>
);

export default LauncherBody;
