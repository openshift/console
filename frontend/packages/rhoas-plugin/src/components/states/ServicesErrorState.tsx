import * as React from 'react';
import ErrorCircle from '@patternfly/react-icons/dist/js/icons/error-circle-o-icon';
import './ServicesErrorState.css';
import { ServicesEmptyState, ServicesEmptyStateProps } from './ServicesEmptyState';

export const ServicesErrorState = ({ title, message, actionLabel }: ServicesEmptyStateProps) => {
  return (
    <ServicesEmptyState
      title={title}
      message={message}
      actionLabel={actionLabel}
      icon={ErrorCircle}
      iconClass={'rhoas-services-error-state-icon'}
    />
  );
};
