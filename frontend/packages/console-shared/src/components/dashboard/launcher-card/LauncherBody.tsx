import type { FC, ReactNode } from 'react';

import './launcher-card.scss';

interface LauncherBodyProps {
  children?: ReactNode;
}

const LauncherBody: FC<LauncherBodyProps> = ({ children }) => (
  <div className="co-launcher-card__body">{children}</div>
);

export default LauncherBody;
