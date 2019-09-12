import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import { ServiceModelAlpha, ServiceModelBeta } from '../../models';
import ServiceHeader from './ServiceHeader';
import { ServiceRowAlpha, ServiceRowBeta } from './ServiceRow';

export const ServiceListAlpha: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={ServiceModelAlpha.labelPlural}
    Header={ServiceHeader}
    Row={ServiceRowAlpha}
    virtualize
  />
);

export const ServiceListBeta: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={ServiceModelBeta.labelPlural}
    Header={ServiceHeader}
    Row={ServiceRowBeta}
    virtualize
  />
);
