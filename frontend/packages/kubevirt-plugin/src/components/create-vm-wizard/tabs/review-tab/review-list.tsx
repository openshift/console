import * as React from 'react';
import * as classNames from 'classnames';

import './review-list.scss';

type ReviewListItem = {
  id: string;
  value: string;
};

type NetworkingTabComponentProps = {
  title: string;
  items: ReviewListItem[];
  className: string;
};

export const ReviewList: React.FC<NetworkingTabComponentProps> = ({
  title,
  items,
  className,
  children,
}) => {
  return (
    <dl className={classNames('kubevirt-create-vm-modal__review-tab-review-list', className)}>
      <dt>{title}</dt>
      <dd>
        {children}
        <ul className="kubevirt-create-vm-modal__review-tab-review-list-list">
          {items.map(({ id, value }) => (
            <li key={id}>{value}</li>
          ))}
        </ul>
      </dd>
    </dl>
  );
};
