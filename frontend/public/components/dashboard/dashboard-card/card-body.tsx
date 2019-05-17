import * as React from 'react';
import classNames from 'classnames';
import { CardBody, CardBodyProps } from '@patternfly/react-core';

import { LoadingInline } from '../../utils';

export const DashboardCardBody: React.FC<DashboardCardBodyProps> = React.memo(({ isLoading, classname, children, ...props }) => (
  <CardBody className={classNames('co-dashboard-card__body', classname)} {...props}>
    {isLoading ? <LoadingInline /> : children}
  </CardBody>
));

type DashboardCardBodyProps = CardBodyProps & {
  classname?: string;
  children: React.ReactNode;
  isLoading?: boolean;
};
