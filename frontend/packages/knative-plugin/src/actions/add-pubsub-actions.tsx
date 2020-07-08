import * as React from 'react';
import { StarIcon } from '@patternfly/react-icons';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';

export const addSubscription: KebabAction = createKebabAction(
  'Add Subscription',
  <StarIcon />,
  ImportOptions.EVENTPUBSUB,
);

export const addTrigger: KebabAction = createKebabAction(
  'Add Trigger',
  <StarIcon />,
  ImportOptions.EVENTPUBSUB,
);
