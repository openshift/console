import * as React from 'react';
import * as _ from 'lodash-es';
import { OverlayTrigger, Tooltip } from 'patternfly-react';

import { LoadingInline } from '../../utils';

export const DetailItem: React.FC<DetailItemProps> = React.memo(({ title, value, isLoading }) => {
  const description = value ? (
    <OverlayTrigger
      overlay={<Tooltip id={_.uniqueId('tooltip-for-')}>{value}</Tooltip>}
      placement="top"
      trigger={['hover', 'focus']}
      rootClose={false}
    >
      <span>{value}</span>
    </OverlayTrigger>
  ) : (
    <span className="text-secondary">Unavailable</span>
  );
  return (
    <React.Fragment>
      <dt className="co-details-card__item-title">{title}</dt>
      <dd className="co-details-card__item-value">{isLoading ? <LoadingInline /> : description}</dd>
    </React.Fragment>
  );
});

type DetailItemProps = {
  title: string;
  value?: string;
  isLoading: boolean;
};
