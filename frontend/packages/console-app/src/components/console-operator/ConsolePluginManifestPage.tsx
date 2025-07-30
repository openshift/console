import * as React from 'react';
import { Language } from '@patternfly/react-code-editor';
import { useTranslation } from 'react-i18next';
import { PageComponentProps, EmptyBox } from '@console/internal/components/utils';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import CodeEditor from '@console/shared/src/components/editor/CodeEditor';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

export const ConsolePluginManifestPage: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation();
  const pluginStore = usePluginStore();
  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginManifest = React.useMemo(() => pluginStore.getDynamicPluginManifest(pluginName), [
    pluginStore,
    pluginName,
  ]);

  const manifestJson = React.useMemo(() => {
    return pluginManifest ? JSON.stringify(pluginManifest, null, 2) : '';
  }, [pluginManifest]);

  return (
    <PaneBody>
      {pluginManifest ? (
        <CodeEditor
          value={manifestJson}
          language={Language.json}
          minHeight="400px"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      ) : (
        <EmptyBox label={t('console-app~Plugin manifest')} />
      )}
    </PaneBody>
  );
};
