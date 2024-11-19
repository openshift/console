import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import * as semver from 'semver';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { useOpenShiftVersion, YellowExclamationTriangleIcon } from '@console/shared';
import { DASH } from '@console/shared/src/constants';

const ConsolePluginDependenciesDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const { t } = useTranslation();

  const pluginStore = usePluginStore();
  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = React.useMemo(() => pluginStore.findDynamicPluginInfo(pluginName), [
    pluginStore,
    pluginName,
  ]);

  const openshiftVersion = semver.coerce(useOpenShiftVersion());

  return isLoadedDynamicPluginInfo(pluginInfo) ? (
    <>
      {!_.isEmpty(pluginInfo.metadata?.dependencies)
        ? Object.entries(pluginInfo.metadata.dependencies).map(([key, value]) => (
            <div key={key}>
              {`${key}: ${value}`}
              {key === '@console/pluginAPI' && !semver.satisfies(openshiftVersion, value) && (
                <Tooltip
                  content={t('console-app~Not compatible with OpenShift version {{version}}.', {
                    version: openshiftVersion,
                  })}
                >
                  <YellowExclamationTriangleIcon className="co-icon-space-l" />
                </Tooltip>
              )}
            </div>
          ))
        : DASH}
    </>
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginDependenciesDetail;
