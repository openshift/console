import * as React from 'react';
import { getNamespace } from '@console/shared';
import { ResourcesEventStream } from '@console/internal/components/events';
import {
  importerPodEventFilter,
  launcherPodEventFilter,
  vmEventFilter,
  vmiEventFilter,
  vmiMigrationEventFilter,
} from '../../selectors/event';
import { VMTabProps } from './types';

export const VMEvents: React.FC<VMTabProps> = ({ obj: vm }) => (
  <ResourcesEventStream
    filters={[
      vmiEventFilter(vm),
      vmEventFilter(vm),
      launcherPodEventFilter(vm),
      importerPodEventFilter(vm),
      vmiMigrationEventFilter(vm),
    ]}
    namespace={getNamespace(vm)}
  />
);
