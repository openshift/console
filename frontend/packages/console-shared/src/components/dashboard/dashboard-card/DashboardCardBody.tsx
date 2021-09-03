import * as React from 'react';
import { CardBody } from '@patternfly/react-core';
import classNames from 'classnames';
import { DashboardCardBodyProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { LoadingInline } from '@console/internal/components/utils/status-box';

const DashboardCardBody: React.FC<DashboardCardBodyProps> = React.memo(
  ({ isLoading, classname, children, ...props }) => (
    <CardBody className={classNames('co-dashboard-card__body', classname)} {...props}>
      {isLoading ? <LoadingInline /> : children}
    </CardBody>
  ),
);

export default DashboardCardBody;
