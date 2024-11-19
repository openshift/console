import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceYAMLEditor } from '@console/dynamic-plugin-sdk/src/lib-core';
import { PageComponentProps, EmptyBox } from '@console/internal/components/utils';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';

export const ConsolePluginManifestPage: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation();
  const pluginStore = usePluginStore();
  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginManifest = React.useMemo(() => pluginStore.getDynamicPluginManifest(pluginName), [
    pluginStore,
    pluginName,
  ]);

  return (
    <>
      {pluginManifest ? (
        <ResourceYAMLEditor
          initialResource={JSON.stringify(pluginManifest, null, 2)}
          readOnly
          hideHeader
        />
      ) : (
        <div className="co-m-pane__body">
          <EmptyBox label={t('console-app~Plugin manifest')} />
        </div>
      )}
    </>
  );
};
