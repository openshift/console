import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import VirtualizedTable from '@console/internal/components/factory/Table/VirtualizedTable';
import { getPDBTableColumns } from './pdb-table-columns';
import PodDisruptionBudgetTableRow from './PDBTableRow';
import { PodDisruptionBudgetKind } from './types';

const PodDisruptionBudgetList: React.FC<PodDisruptionBudgetsListProps> = (props) => {
  const { t } = useTranslation();
  const [columns] = useActiveColumns({ columns: getPDBTableColumns() });

  return (
    <VirtualizedTable<PodDisruptionBudgetKind>
      {...props}
      aria-label={t('console-app~PodDisruptionBudgets')}
      label={t('console-app~PodDisruptionBudgets')}
      columns={columns}
      Row={PodDisruptionBudgetTableRow}
    />
  );
};

export default PodDisruptionBudgetList;

type PodDisruptionBudgetsListProps = {
  data: PodDisruptionBudgetKind[];
  unfilteredData: PodDisruptionBudgetKind[];
  loaded: boolean;
  loadError: any;
};
