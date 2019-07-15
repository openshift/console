import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import { RevisionModel } from '../../models';
import RevisionHeader from './RevisionHeader';
import RevisionRow from './RevisionRow';

const RevisionList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={RevisionModel.labelPlural}
    Header={RevisionHeader}
    Row={RevisionRow}
    virtualize
  />
);

export default RevisionList;
