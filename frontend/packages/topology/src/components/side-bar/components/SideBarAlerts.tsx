import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { GraphElement } from '@patternfly/react-topology';
import {
  DetailsResourceAlert,
  DetailsResourceAlertContent,
  isDetailsResourceAlert,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { USERSETTINGS_PREFIX, useUserSettings } from '@console/shared';

const SIDEBAR_ALERTS = 'sideBarAlerts';

const ResolveResourceAlerts: React.FC<{
  id?: string;
  useResourceAlertsContent?: (element: GraphElement) => DetailsResourceAlertContent;
  element: GraphElement;
}> = ({ id, useResourceAlertsContent, element }) => {
  const [showAlert, setShowAlert, loaded] = useUserSettings(
    `${USERSETTINGS_PREFIX}.${SIDEBAR_ALERTS}.${id}`,
    true,
  );
  const alertConfigs = useResourceAlertsContent(element);
  if (!alertConfigs) return null;
  const { variant, content, actionLinks, dismissible, title } = alertConfigs;
  return loaded && showAlert ? (
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
};

const SideBarAlerts: React.FC<{ element: GraphElement }> = ({ element }) => {
  const [resourceAlertsExtension, resolved] = useResolvedExtensions<DetailsResourceAlert>(
    isDetailsResourceAlert,
  );
  return resolved ? (
    <>
      {resourceAlertsExtension.map(({ uid, properties: { contentProvider, ...props } }) => (
        <ResolveResourceAlerts
          key={uid}
          {...props}
          useResourceAlertsContent={contentProvider}
          element={element}
        />
      ))}
    </>
  ) : null;
};

export default SideBarAlerts;
