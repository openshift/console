import * as React from 'react';
import { CardBody, CardBodyProps } from '@patternfly/react-core';
import classNames from 'classnames';
import { LoadingInline } from '@console/internal/components/utils/status-box';

const DashboardCardBody: React.FC<DashboardCardBodyProps> = React.memo(
  ({ isLoading, classname, children, ...props }) => (
    <CardBody className={classNames('co-dashboard-card__body', classname)} {...props}>
      {isLoading ? <LoadingInline /> : children}
    </CardBody>
  ),
);

export default DashboardCardBody;

type DashboardCardBodyProps = CardBodyProps & {
  classname?: string;
  children: React.ReactNode;
  isLoading?: boolean;
};
