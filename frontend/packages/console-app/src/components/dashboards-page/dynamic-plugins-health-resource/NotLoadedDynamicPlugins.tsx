import * as React from 'react';
import { StackItem, Content } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';
import { ConsolePluginModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { NotLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { StatusPopupSection } from '@console/shared/src/components/dashboard/status-card/StatusPopup';

const NotLoadedDynamicPlugins: React.FC<NotLoadedDynamicPluginsProps> = ({ plugins, label }) => (
  <StackItem>
    <StatusPopupSection firstColumn={label}>
      <Content component="ul">
        {plugins.map((plugin) => (
          <Content component="li" key={plugin.pluginName}>
            <ResourceLink
              kind={referenceForModel(ConsolePluginModel)}
              name={plugin.pluginName}
              hideIcon
            />
          </Content>
        ))}
      </Content>
    </StatusPopupSection>
  </StackItem>
);

type NotLoadedDynamicPluginsProps = {
  plugins: NotLoadedDynamicPluginInfo[];
  label: string;
};

export default NotLoadedDynamicPlugins;
