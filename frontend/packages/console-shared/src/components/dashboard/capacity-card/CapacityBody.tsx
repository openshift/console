import * as React from 'react';
import './capacity-card.scss';

const CapacityBody: React.FC<CapacityBodyProps> = ({ children }) => (
  <div className="co-capacity-card__body">{children}</div>
);

export default CapacityBody;

type CapacityBodyProps = {
  children: React.ReactNode;
};
