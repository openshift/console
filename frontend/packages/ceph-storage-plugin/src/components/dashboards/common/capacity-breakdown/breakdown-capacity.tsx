import * as React from 'react';
import classnames from 'classnames';
import './breakdown-card.scss';

export const TotalCapacityBody: React.FC<TotalCapacityBodyProps> = ({
  capacity,
  suffix,
  className,
}) => {
  return (
    <p className={classnames('capacity-breakdown-card__capacity-body', className)}>
      {capacity} {suffix}
    </p>
  );
};

type TotalCapacityBodyProps = {
  capacity: string;
  suffix: string;
  className?: string;
};
