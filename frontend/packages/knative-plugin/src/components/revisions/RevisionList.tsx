import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import RevisionHeader from './RevisionHeader';
import RevisionRow from './RevisionRow';

const RevisionList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <Table
      {...props}
      aria-label={t('Revisions')}
      Header={RevisionHeader(t)}
      Row={RevisionRow}
      virtualize
    />
  );
};

export default RevisionList;
