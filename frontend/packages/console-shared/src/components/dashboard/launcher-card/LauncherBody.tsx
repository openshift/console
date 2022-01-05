import * as React from 'react';

import './launcher-card.scss';

const LauncherBody: React.FC = ({ children }) => (
  <div className="co-launcher-card__body">{children}</div>
);

export default LauncherBody;
