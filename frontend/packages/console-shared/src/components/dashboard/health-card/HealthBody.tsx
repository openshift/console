import * as React from 'react';
import classNames from 'classnames';
import './health-card.scss';

const HealthBody: React.FC<HealthBodyProps> = React.memo(({ children, className }) => (
  <div
    className={classNames('co-dashboard-card__body--top-margin co-health-card__body', className)}
  >
    {children}
  </div>
));

export default HealthBody;

type HealthBodyProps = {
  className?: string;
  children: React.ReactNode;
};
