import type { FC } from 'react';
import { OverviewItem } from '@console/shared/src/types/resource';
import { OwnerReferences } from './owner-references';
import { useTranslation } from 'react-i18next';

const OperatorBackedOwnerReferences: FC<OperatorBackedOwnerReferencesProps> = ({ item }) => {
  const { t } = useTranslation();

  return item.isOperatorBackedService ? (
    <span className="sidebar__section-owner-operator-heading">
      {t('public~Managed by:')}
      <span className="sidebar__section-owner-reference-operator">
        <OwnerReferences resource={item.obj} />
      </span>
    </span>
  ) : null;
};

type OperatorBackedOwnerReferencesProps = {
  item: OverviewItem;
};

OperatorBackedOwnerReferences.displayName = 'OperatorBackedOwnerReferences';

export default OperatorBackedOwnerReferences;
