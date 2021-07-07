import * as React from 'react';
import { ResourcesEventStream } from '@console/internal/components/events';
import { getNamespace } from '../../selectors';
import { getVmEventsFilters } from '../../selectors/event';
import { VMTabProps } from './types';

export const VMEvents: React.FC<VMTabProps> = ({ obj: vm }) => (
  <ResourcesEventStream filters={getVmEventsFilters(vm)} namespace={getNamespace(vm)} />
);
