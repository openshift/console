import * as React from 'react';
import { 
  Button, 
  EmptyState,
  EmptyStateIcon,
  Title 
} from '@patternfly/react-core';
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';

type ManagedKafkaEmptyStateProps = {
  title: string;
  actionInfo: string;
  action?: () => void;
  icon: string;
}

export const ManagedKafkaEmptyState = ({ title, actionInfo, action, icon }: ManagedKafkaEmptyStateProps) => {

  const renderIcon = () => {
    switch (icon) {
      case 'TimesCircleIcon':
        return TimesCircleIcon;
      case 'CubesIcon':
        return CubesIcon;
      default:
        return undefined;
    }
  }

  return (
  <EmptyState>
    <EmptyStateIcon icon={renderIcon()} />
    <Title headingLevel="h4" size="lg">
      {title}
    </Title>
    <Button variant="link" onClick={action && action}>{actionInfo}</Button>
  </EmptyState>
  )
}
