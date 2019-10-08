import * as React from 'react';
import './inventory-card.scss';

const InventoryBody: React.FC = ({ children }) => (
  <div className="co-dashboard-card__body--no-padding">{children}</div>
);

export default InventoryBody;
