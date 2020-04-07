import * as React from 'react';
import { HelpIcon } from '@patternfly/react-icons';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';

export const addEventSource: KebabAction = createKebabAction(
  'Event Source',
  <HelpIcon />,
  ImportOptions.EVENTSOURCE,
);
