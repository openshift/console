import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { GraphElement } from '@patternfly/react-topology';
import {
  DetailsResourceAlert,
  DetailsResourceAlertContent,
  isDetailsResourceAlert,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';

const ResolveResourceAlerts: React.FC<{
  id?: string;
  dismissible?: boolean;
  title?: string;
  useResourceAlertsContent?: (element: GraphElement) => DetailsResourceAlertContent;
  element: GraphElement;
}> = ({ title, dismissible = false, useResourceAlertsContent, element }) => {
  const [showAlert, setShowAlert] = React.useState<boolean>(true);
  const alertConfigs = useResourceAlertsContent(element);
  if (!alertConfigs) return null;
  const { variant, content, actionLinks, onClose } = alertConfigs;
  return showAlert ? (
    <Alert
      isInline
      variant={variant}
      title={title}
      actionLinks={actionLinks}
      actionClose={
        <AlertActionCloseButton
          onClose={() => {
            if (dismissible) setShowAlert(false);
            else onClose?.();
          }}
        />
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
