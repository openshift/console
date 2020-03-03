import * as React from 'react';
import { OverviewItem } from '@console/shared';
import { OwnerReferences } from './owner-references';

const OperatorBackedOwnerReferences: React.FC<OperatorBackedOwnerReferencesProps> = ({ item }) => {
  return item.isOperatorBackedService ? (
    <span className="sidebar__section-owner-operator-heading">
      Managed by:
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
