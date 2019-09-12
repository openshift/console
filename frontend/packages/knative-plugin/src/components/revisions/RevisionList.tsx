import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import { RevisionModelAlpha, RevisionModelBeta } from '../../models';
import RevisionHeader from './RevisionHeader';
import { RevisionRowAlpha, RevisionRowBeta } from './RevisionRow';

export const RevisionListAlpha: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={RevisionModelAlpha.labelPlural}
    Header={RevisionHeader}
    Row={RevisionRowAlpha}
    virtualize
  />
);

export const RevisionListBeta: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={RevisionModelBeta.labelPlural}
    Header={RevisionHeader}
    Row={RevisionRowBeta}
    virtualize
  />
);
