import * as React from 'react';
import { SignOutAltIcon } from '@patternfly/react-icons';
import i18next from 'i18next';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { Action } from '@console/dynamic-plugin-sdk';
import { UNASSIGNED_KEY } from '@console/topology/src/const';

export const AddEventSourceAction = (
  namespace: string,
  application?: string,
  contextSource?: string,
  path?: string,
): Action => {
  const params = new URLSearchParams();
  const pageUrl = `/catalog/ns/${namespace}`;
  params.append('catalogType', 'EventSource');
  contextSource && params.append(QUERY_PROPERTIES.CONTEXT_SOURCE, contextSource);
  application
    ? params.append(QUERY_PROPERTIES.APPLICATION, application)
    : params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  return {
    id: 'event-source-add',
    label: i18next.t('knative-plugin~Event Source'),
    icon: <SignOutAltIcon />,
    cta: {
      href: `${pageUrl}?${params.toString()}`,
    },
    path,
    insertAfter: 'event-sink-add',
  };
};
