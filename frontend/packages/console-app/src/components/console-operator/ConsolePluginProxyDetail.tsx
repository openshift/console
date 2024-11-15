import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';
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
    spec: { proxy },
  },
}) =>
  proxy && proxy.length > 0 ? (
    <List isPlain>
      {proxy.map(
        (p) =>
          // only Service is supported per the ConsolePlugin schema
          p.endpoint.type === ServiceModel.label && (
            <ListItem key={p.endpoint.service.name}>
              <ResourceLink
                name={p.endpoint.service.name}
                namespace={p.endpoint.service.namespace}
                groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
              />
            </ListItem>
          ),
      )}
    </List>
  ) : (
    <>{DASH}</>
  );

type ConsolePluginBackendDetailProps = Omit<DetailsItemComponentProps, 'obj'> & {
  obj: ConsolePluginKind;
};

export default ConsolePluginBackendDetail;
