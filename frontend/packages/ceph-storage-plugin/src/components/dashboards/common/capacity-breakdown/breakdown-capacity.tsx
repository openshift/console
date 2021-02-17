import * as React from 'react';
import * as classNames from 'classnames';
import './breakdown-card.scss';

export const TotalCapacityBody: React.FC<TotalCapacityBodyProps> = ({
  capacity,
  suffix,
  className,
}) => {
  return (
    <p className={classNames('capacity-breakdown-card__capacity-body', className)}>
      {capacity} {suffix}
    </p>
  );
};

type TotalCapacityBodyProps = {
  capacity: string;
  suffix: string;
  className?: string;
};
