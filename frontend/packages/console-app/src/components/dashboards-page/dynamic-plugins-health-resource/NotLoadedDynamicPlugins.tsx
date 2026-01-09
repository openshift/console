import type { FC } from 'react';
import type { FailedPluginInfoEntry, PendingPluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import { StackItem, Content } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ConsolePluginModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { StatusPopupSection } from '@console/shared/src/components/dashboard/status-card/StatusPopup';

const NotLoadedDynamicPlugins: FC<NotLoadedDynamicPluginsProps> = ({ plugins, label }) => (
  <StackItem>
    <StatusPopupSection firstColumn={label}>
      <Content component="ul">
        {plugins.map((plugin) => (
          <Content component="li" key={plugin.manifest.name}>
            <ResourceLink
              kind={referenceForModel(ConsolePluginModel)}
              name={plugin.manifest.name}
              hideIcon
            />
          </Content>
        ))}
      </Content>
    </StatusPopupSection>
  </StackItem>
);

type NotLoadedDynamicPluginsProps = {
  plugins: (FailedPluginInfoEntry | PendingPluginInfoEntry)[];
  label: string;
};

export default NotLoadedDynamicPlugins;
