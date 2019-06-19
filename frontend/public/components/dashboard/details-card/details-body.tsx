import * as React from 'react';

export const DetailsBody: React.FC<DetailsBodyProps> = ({ children }) => (
  <dl className="co-details-card__body">{children}</dl>
);

type DetailsBodyProps = {
  children: React.ReactNode;
}
