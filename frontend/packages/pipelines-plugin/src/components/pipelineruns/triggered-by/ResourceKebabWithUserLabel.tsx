import * as React from 'react';
import { KebabAction, ResourceKebab } from '@console/internal/components/utils';
import { useMenuActionsWithUserAnnotation } from './hooks';

const ResourceKebabWithUserLabel: React.FC<React.ComponentProps<typeof ResourceKebab>> = ({
  actions,
  ...otherProps
}) => {
  const augmentedMenuActions: KebabAction[] = useMenuActionsWithUserAnnotation(actions);

  return <ResourceKebab {...otherProps} actions={augmentedMenuActions} />;
};

export default ResourceKebabWithUserLabel;
