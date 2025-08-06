import * as React from 'react';
import { Language } from '@patternfly/react-code-editor';
import { useTranslation } from 'react-i18next';
import { PageComponentProps, EmptyBox } from '@console/internal/components/utils';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { BasicCodeEditor } from '@console/shared/src/components/editor/BasicCodeEditor';
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
    <PaneBody fullHeight>
      {pluginManifest ? (
        <CodeEditor
          value={manifestJson}
          isLanguageLabelVisible
          language={Language.json}
          headerMainContent={t('console-app~console-extensions.json (read only)')}
          isReadOnly
          isMinimapVisible={false}
          minHeight="400px"
          options={{
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
