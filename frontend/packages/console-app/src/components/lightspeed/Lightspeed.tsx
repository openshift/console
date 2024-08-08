import * as React from 'react';
import {
  Alert,
  Button,
  Page,
  PageSection,
  Stack,
  StackItem,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import { WindowMinimizeIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { useHideLightspeed } from '@console/app/src/components/user-preferences/lightspeed';
import { k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { history } from '@console/internal/components/utils';
import { ConsolePluginModel } from '@console/internal/models';
import { FLAGS, useTelemetry } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import './Lightspeed.scss';

const getLightspeedInstallationStatus = async () => {
  try {
    await k8sGetResource({
      model: ConsolePluginModel,
      name: 'lightspeed-console-plugin',
    });
    return true;
  } catch (err) {
    if (err.response.status !== 404) {
      // eslint-disable-next-line no-console
      console.log(err.message);
    }
    return false;
  }
};

export const lightspeedOperatorURL =
  '/operatorhub/all-namespaces?keyword=lightspeed&details-item=lightspeed-operator-redhat-operators-openshift-marketplace';

const Lightspeed: React.FC = () => {
  const { t } = useTranslation();
  const [hideLightspeed] = useHideLightspeed();
  const [isReady, setIsReady] = React.useState(false);
  const [lightspeedIsInstalled, setLightspeedIsInstalled] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const fireTelemetryEvent = useTelemetry();
  const canListPackageManifest = useFlag(FLAGS.CAN_LIST_PACKAGE_MANIFEST);
  const canListOperatorGroup = useFlag(FLAGS.CAN_LIST_OPERATOR_GROUP);
  const canInstallLightspeed = canListPackageManifest && canListOperatorGroup;

  React.useEffect(() => {
    const checkIfLightspeedIsInstalled = async () => {
      if (await getLightspeedInstallationStatus()) {
        setLightspeedIsInstalled(true);
      }
      setIsReady(true);
    };
    checkIfLightspeedIsInstalled();
  }, [isReady]);

  const onPopoverButtonClick = () => {
    setIsOpen(!isOpen);
    fireTelemetryEvent('Console capability LightspeedButton clicked');
  };
  const onInstallClick = () => {
    setIsOpen(false);
    history.push(lightspeedOperatorURL);
    fireTelemetryEvent('Console capability LightspeedButton Get started button clicked');
  };

  const title = t('console-app~Red Hat OpenShift Lightspeed');
  const button = (
    <Button
      variant="link"
      className="lightspeed__popover-button"
      onClick={onPopoverButtonClick}
      aria-label={title}
    />
  );

  if (hideLightspeed || !isReady || lightspeedIsInstalled) {
    return null;
  }

  return isOpen ? (
    <>
      <div className="lightspeed__popover lightspeed__popover--collapsed">
        <Page>
          <PageSection variant="light">
            <WindowMinimizeIcon
              className="lightspeed__popover-close"
              onClick={onPopoverButtonClick}
            />
          </PageSection>
          <PageSection variant="light" isFilled>
            <Stack hasGutter>
              <StackItem>
                <div className="lightspeed__welcome-logo" />
                <Title className="pf-v5-u-text-align-center" headingLevel="h1">
                  {title}
                </Title>
              </StackItem>
              <StackItem isFilled className="pf-v5-u-text-align-center">
                {t(
                  'console-app~OpenShift Lightspeed is an AI-based virtual assistant integrated into the OpenShift web console, designed to answer questions and assist with troubleshooting and investigating cluster resources using natural language. It leverages extensive OpenShift experience to enhance efficiency and productivity.',
                )}
              </StackItem>
              {canInstallLightspeed ? (
                <StackItem className="pf-v5-u-text-align-center">
                  <Button variant="primary" className="pf-v5-u-mr-sm" onClick={onInstallClick}>
                    {t('console-app~Install')}
                  </Button>
                </StackItem>
              ) : (
                <StackItem>
                  <Alert
                    variant="info"
                    isInline
                    title={t(
                      'console-app~Please contact your administrator to enable this feature for you.',
                    )}
                  />
                </StackItem>
              )}
            </Stack>
          </PageSection>
        </Page>
      </div>
      {button}
    </>
  ) : (
    <Tooltip content={title}>{button}</Tooltip>
  );
};
export default Lightspeed;
