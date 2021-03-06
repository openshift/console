import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { ConsolePluginWarning } from './console-plugin-warning';
import { ConsolePluginRadioInputs } from './console-plugin-radio-inputs';
import { isCatalogSourceTrusted } from '../utils';

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
        <Popover
          headerContent={<div>{t('olm~Console UI extension', { count: csvPluginsCount })}</div>}
          bodyContent={
            <div>
              {t(
                'olm~This operator provides a custom interface you can include in your console. Make sure you trust this operator before enabling its interface.',
              )}
            </div>
          }
        >
          <h5 className="co-required co-form-heading__popover">
            <Button variant="plain" className="co-form-heading__popover-button">
              {t('olm~Console UI extension', { count: csvPluginsCount })}
            </Button>
          </h5>
        </Popover>
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
