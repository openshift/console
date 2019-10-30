import * as React from 'react';
import './breakdown-card.scss';
import * as classNames from 'classnames';

export const TotalCapacityBody: React.FC<TotalCapacityBodyProps> = ({ value, className }) => {
  return <p className={classNames('capacity-breakdown-card__capacity-body', className)}>{value}</p>;
};

type TotalCapacityBodyProps = {
  value: string;
  className?: string;
};
