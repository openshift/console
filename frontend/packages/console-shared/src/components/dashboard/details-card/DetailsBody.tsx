import * as React from 'react';
import './details-card.scss';
import { DetailsBodyProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

const DetailsBody: React.FC<DetailsBodyProps> = ({ children }) => (
  <dl className="co-details-card__body">{children}</dl>
);

export default DetailsBody;
