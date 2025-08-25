import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { GraphElement, observer } from '@patternfly/react-topology';
import {
  DetailsResourceAlert,
  DetailsResourceAlertContent,
  isDetailsResourceAlert,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { USERSETTINGS_PREFIX } from '@console/shared';
import { useGetUserSettingConfigMap } from '@console/shared/src/hooks/useGetUserSettingConfigMap';
import { useUserSettingsLocalStorage } from '@console/shared/src/hooks/useUserSettingsLocalStorage';
import { deseralizeData } from '@console/shared/src/utils/user-settings';

const SIDEBAR_ALERTS = 'sideBarAlerts';

const ResolveResourceAlerts: React.FC<{
  id?: string;
  useResourceAlertsContent?: (element: GraphElement) => DetailsResourceAlertContent;
  element: GraphElement;
}> = observer(function ResolveResourceAlerts({ id, useResourceAlertsContent, element }) {
  const [cfData, cfLoaded, cfLoadError] = useGetUserSettingConfigMap();
  const [showAlert, setShowAlert] = useUserSettingsLocalStorage(
    `${USERSETTINGS_PREFIX}/${SIDEBAR_ALERTS}/${id}`,
    `${element.getId()}`,
    deseralizeData(
      cfData?.data?.[`${USERSETTINGS_PREFIX}.${SIDEBAR_ALERTS}.${id}.${element.getId()}`],
    ) || true,
  );

  React.useEffect(() => {
    if (cfData && cfLoaded && !cfLoadError) {
      const alertSetting = deseralizeData(
        cfData?.data?.[`${USERSETTINGS_PREFIX}.${SIDEBAR_ALERTS}.${id}.${element.getId()}`],
      );
      setShowAlert(alertSetting);
    }
  }, [setShowAlert, cfData, cfLoaded, cfLoadError, id, element]);

  const alertConfigs = useResourceAlertsContent(element);
  if (!alertConfigs) return null;
  const { variant, content, actionLinks, dismissible, title } = alertConfigs;
  return showAlert ? (
    <Alert
      isInline
      variant={variant}
      title={title}
      actionLinks={actionLinks}
      actionClose={
        dismissible && (
          <AlertActionCloseButton
            onClose={() => {
              setShowAlert(false);
            }}
          />
        )
      }
    >
      {content}
    </Alert>
  ) : null;
});

const SideBarAlerts: React.FC<{ element: GraphElement }> = ({ element }) => {
  const [resourceAlertsExtension, resolved] = useResolvedExtensions<DetailsResourceAlert>(
    isDetailsResourceAlert,
  );
  return resolved ? (
    <>
      {resourceAlertsExtension.map(({ uid, properties: { contentProvider, ...props } }) => {
        const key = `${uid}-${element.getId()}`;
        return (
          <ResolveResourceAlerts
            key={key}
            {...props}
            useResourceAlertsContent={contentProvider}
            element={element}
          />
        );
      })}
    </>
  ) : null;
};

export default SideBarAlerts;
