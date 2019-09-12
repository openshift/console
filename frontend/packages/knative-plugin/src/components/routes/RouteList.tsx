import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import { RouteModelAlpha, RouteModelBeta } from '../../models';
import RouteHeader from './RouteHeader';
import { RouteRowAlpha, RouteRowBeta } from './RouteRow';

export const RouteListAlpha: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={RouteModelAlpha.labelPlural}
    Header={RouteHeader}
    Row={RouteRowAlpha}
    virtualize
  />
);

export const RouteListBeta: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={RouteModelBeta.labelPlural}
    Header={RouteHeader}
    Row={RouteRowBeta}
    virtualize
  />
);
