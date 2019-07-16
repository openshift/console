import * as React from 'react';
import classNames from 'classnames';

import { LoadingInline } from '../../utils';

export const DetailItem: React.FC<DetailItemProps> = React.memo(({ title, value, isLoading }) => (
  <React.Fragment>
    <dt className="co-details-card__item-title">{title}</dt>
    <dd className={classNames('co-details-card__item-value', {'text-secondary': !value})}>
      {isLoading ? <LoadingInline /> : value || 'Unavailable'}
    </dd>
  </React.Fragment>
));

type DetailItemProps = {
  title: string;
  value?: string;
  isLoading: boolean;
};
