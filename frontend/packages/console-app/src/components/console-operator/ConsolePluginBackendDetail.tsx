import * as React from 'react';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import {
  getGroupVersionKindForModel,
  ResourceLink,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { ServiceModel } from '@console/internal/models';
import { ConsolePluginKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants';

const ConsolePluginBackendDetail: React.FC<ConsolePluginBackendDetailProps> = ({
  obj: {
    spec: { backend },
  },
}) =>
  // only Service is supported per the ConsolePlugin schema
  backend.type === ServiceModel.label ? (
    <ResourceLink
      name={backend.service.name}
      namespace={backend.service.namespace}
      groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
    />
  ) : (
    <>{DASH}</>
  );

type ConsolePluginBackendDetailProps = Omit<DetailsItemComponentProps, 'obj'> & {
  obj: ConsolePluginKind;
};

export default ConsolePluginBackendDetail;
