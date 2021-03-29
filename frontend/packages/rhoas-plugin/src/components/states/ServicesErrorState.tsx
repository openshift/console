import * as React from 'react';
import ErrorCircle from '@patternfly/react-icons/dist/js/icons/error-circle-o-icon';
import { ServicesEmptyState } from './ServicesEmptyState';

import './ServicesErrorState.scss';

export const ServicesErrorState = ({
  title,
  message,
  actionLabel,
}: React.ComponentProps<typeof ServicesEmptyState>) => (
  <ServicesEmptyState
    title={title}
    message={message}
    actionLabel={actionLabel}
    icon={ErrorCircle}
    iconClass="rhoas-services-error-state-icon"
  />
);
