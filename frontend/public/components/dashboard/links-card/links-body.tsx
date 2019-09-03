import * as React from 'react';

export const LinksBody: React.FC<LinksBodyProps> = ({ children }) => (
  <ul className="co-dashboard-card__body--top-margin co-links-card__body">{children}</ul>
);

type LinksBodyProps = {
  children: React.ReactNode;
}
