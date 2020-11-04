import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import RevisionHeader from './RevisionHeader';
import RevisionRow from './RevisionRow';

const RevisionList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Revisions')}
      Header={RevisionHeader(t)}
      Row={RevisionRow}
      virtualize
    />
  );
};

export default RevisionList;
