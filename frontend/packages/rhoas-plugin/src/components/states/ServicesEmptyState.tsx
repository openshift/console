import * as React from 'react';
import { Button, EmptyState, EmptyStateIcon, Title } from '@patternfly/react-core';
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
import { history } from '@console/internal/components/utils';

type ServicesEmptyStateProps = {
  title: string;
  actionInfo?: string;
  action?: () => void;
  icon: string;
};

export const ServicesEmptyState = ({
  title,
  actionInfo,
  action,
  icon,
}: ServicesEmptyStateProps) => {
  const renderIcon = () => {
    switch (icon) {
      case 'TimesCircleIcon':
        return TimesCircleIcon;
      case 'CubesIcon':
        return CubesIcon;
      default:
        return undefined;
    }
  };
  let stateAction;
  if (action) {
    stateAction = action;
  } else {
    stateAction = () => {
      history.goBack();
    };
  }

  return (
    <EmptyState>
      <EmptyStateIcon icon={renderIcon()} />
      <Title headingLevel="h4" size="lg">
        {title}
      </Title>
      <Button variant="link" onClick={stateAction}>
        {actionInfo}
      </Button>
    </EmptyState>
  );
};
