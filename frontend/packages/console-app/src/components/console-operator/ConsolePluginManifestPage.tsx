import type { FC } from 'react';
import { useMemo } from 'react';
import { Language } from '@patternfly/react-code-editor';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { PageComponentProps } from '@console/internal/components/utils/horizontal-nav';
import { EmptyBox } from '@console/internal/components/utils/status-box';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { BasicCodeEditor } from '@console/shared/src/components/editor/BasicCodeEditor';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

export const ConsolePluginManifestPage: FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation();
  const pluginInfoEntries = usePluginInfo();
  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginManifest = useMemo(
    () => pluginInfoEntries.find((entry) => entry.manifest.name === pluginName)?.manifest,
    [pluginInfoEntries, pluginName],
  );

  const manifestJSON = useMemo(() => {
    return pluginManifest ? JSON.stringify(pluginManifest, null, 2) : '';
  }, [pluginManifest]);

  return (
    <PaneBody fullHeight>
      {pluginManifest ? (
        <BasicCodeEditor
          code={manifestJSON}
          isFullHeight
          isLanguageLabelVisible
          language={Language.json}
          // @ts-expect-error - headerMainContent expects string but we want to use a React element with Label
          headerMainContent={
            <div className="pf-v6-l-flex pf-m-align-items-center pf-m-gap-md">
              <span>{t('console-app~console-extensions.json')}</span>
              <Label color="grey" isCompact>
                {t('console-app~Read only')}
              </Label>
            </div>
          }
          isReadOnly
          isMinimapVisible={false}
          isDownloadEnabled
          isCopyEnabled
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
