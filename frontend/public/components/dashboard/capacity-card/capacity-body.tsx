import * as React from 'react';

export const CapacityBody: React.FC<CapacityBodyProps> = ({ children }) => (
  <div className="co-capacity-card__body">{children}</div>
);

type CapacityBodyProps = {
  children: React.ReactNode;
}
