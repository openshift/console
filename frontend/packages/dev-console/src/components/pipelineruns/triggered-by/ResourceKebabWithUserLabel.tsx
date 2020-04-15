import * as React from 'react';
import { KebabAction, ResourceKebab } from '@console/internal/components/utils';
import { useMenuActionsWithUserLabel } from './hooks';

const ResourceKebabWithUserLabel: React.FC<React.ComponentProps<typeof ResourceKebab>> = ({
  actions,
  ...otherProps
}) => {
  const augmentedMenuActions: KebabAction[] = useMenuActionsWithUserLabel(actions);

  return <ResourceKebab {...otherProps} actions={augmentedMenuActions} />;
};

export default ResourceKebabWithUserLabel;
