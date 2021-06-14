import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { isCatalogSourceTrusted } from '../utils';
import { ConsolePluginRadioInputs } from './console-plugin-radio-inputs';
import { ConsolePluginWarning } from './console-plugin-warning';

export const ConsolePluginFormGroup: React.FC<ConsolePluginFormGroupProps> = ({
  catalogSource,
  csvPlugins,
  enabledPlugins,
  setPluginEnabled,
}) => {
  const { t } = useTranslation();
  const csvPluginsCount = csvPlugins.length;

  return (
    <div className="form-group">
      <fieldset>
        <label className="co-required">{t('olm~Console plugin', { count: csvPluginsCount })}</label>
        <FieldLevelHelp>
          {t(
            'olm~This operator includes a console plugin which provides a custom interface that can be included in the console. The console plugin will prompt for the console to be refreshed once it has been enabled. Make sure you trust this console plugin before enabling.',
          )}
        </FieldLevelHelp>
        {csvPlugins.map((plugin) => (
          <fieldset key={plugin}>
            <div>
              {csvPluginsCount > 1 && (
                <legend className="co-legend co-legend--nested text-muted">{plugin}</legend>
              )}
              <ConsolePluginRadioInputs
                name={plugin}
                enabled={enabledPlugins.includes(plugin)}
                onChange={(enabled: boolean) => setPluginEnabled(plugin, enabled)}
              />
            </div>
          </fieldset>
        ))}
        <ConsolePluginWarning
          // always show the warning for untrusted plugins set to enabled
          previouslyEnabled={false}
          enabled={enabledPlugins?.length > 0}
          trusted={isCatalogSourceTrusted(catalogSource)}
        />
      </fieldset>
    </div>
  );
};

type ConsolePluginFormGroupProps = {
  catalogSource: string;
  csvPlugins: string[];
  enabledPlugins: string[];
  setPluginEnabled: (plugin: string, enabled: boolean) => void;
};
