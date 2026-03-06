import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  List,
  ListItem,
  Stack,
  StackItem,
  Content,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useHideLightspeed } from '@console/app/src/components/user-preferences/lightspeed/useHideLightspeed';
import { k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ConsolePluginModel } from '@console/internal/models';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
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
  '/catalog?catalogType=operator&keyword=lightspeed&selectedId=lightspeed-operator-redhat-operators-openshift-marketplace';

const Lightspeed: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hideLightspeed] = useHideLightspeed();
  const [isReady, setIsReady] = useState(false);
  const [lightspeedIsInstalled, setLightspeedIsInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fireTelemetryEvent = useTelemetry();
  const canListPackageManifest = useFlag(FLAGS.CAN_LIST_PACKAGE_MANIFEST);
  const canListOperatorGroup = useFlag(FLAGS.CAN_LIST_OPERATOR_GROUP);
  const canInstallLightspeed = canListPackageManifest && canListOperatorGroup;

  useEffect(() => {
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
    navigate(lightspeedOperatorURL);
    fireTelemetryEvent('Console capability LightspeedButton Get started button clicked');
  };
  const onDismissClick = () => {
    setIsOpen(false);
    navigate(
      '/user-preferences/general?spotlight=[data-test="console.hideLightspeedButton%20field"]',
    );
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
        <Stack hasGutter>
          <StackItem>
            <div className="lightspeed__welcome-logo" />
            <Title headingLevel="h1" className="pf-v6-u-mb-sm">
              {t('console-app~Meet OpenShift Lightspeed')}
            </Title>
            <Content component="p" className="pf-v6-u-color-200 pf-v6-u-font-size-lg pf-v6-u-mb-md">
              {t(
                "console-app~Unlock possibilities and enhance productivity with the AI-powered assistant's expert guidance in your OpenShift web console.",
              )}
            </Content>
          </StackItem>
          <StackItem isFilled>
            <Title headingLevel="h2" className="pf-v6-u-mb-md">
              {t('console-app~Benefits:')}
            </Title>
            <List isPlain isBordered className="pf-v6-u-color-200 pf-v6-u-ml-sm">
              <ListItem>
                {t('console-app~Get fast answers to questions you have related to OpenShift')}
              </ListItem>
              <ListItem>
                {t(
                  "console-app~Quickly troubleshoot with OpenShift Lightspeed's extensive knowledge",
                )}
              </ListItem>
              <ListItem>
                {t(
                  'console-app~Understand your cluster resources, such as the number of pods running on a particular namespace',
                )}
              </ListItem>
              <ListItem>
                {t('console-app~Free up your IT teams so that you can drive greater innovation')}
              </ListItem>
            </List>
          </StackItem>
          {canInstallLightspeed ? (
            <StackItem className="pf-v6-u-text-align-center">
              <Button variant="primary" size="lg" onClick={onInstallClick}>
                {t('console-app~Get started in Software Catalog')}
              </Button>
            </StackItem>
          ) : (
            <StackItem>
              <Alert
                variant="info"
                isInline
                title={t('console-app~Must have administrator access')}
              >
                <Content component="p">
                  {t(
                    'console-app~Contact your administrator and ask them to install Red Hat OpenShift Lightspeed.',
                  )}
                </Content>
              </Alert>
            </StackItem>
          )}
          <StackItem className="pf-v6-u-text-align-center">
            <Button variant="link" onClick={onDismissClick}>
              {t('console-app~Edit user preferences to not show again')}
            </Button>
          </StackItem>
        </Stack>
      </div>
      {button}
    </>
  ) : (
    <Tooltip content={title}>{button}</Tooltip>
  );
};
export default Lightspeed;
