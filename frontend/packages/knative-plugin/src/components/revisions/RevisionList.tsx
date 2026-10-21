import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import RevisionHeader from './RevisionHeader';
import RevisionRow from './RevisionRow';

const RevisionList: FC<TableProps> = (props) => {
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
