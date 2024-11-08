import * as React from 'react';
import {
  Alert,
  Button,
  List,
  ListItem,
  Page,
  PageSection,
  Stack,
  StackItem,
  Text,
  Title,
  Tooltip,
} from '@patternfly/react-core';
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
  const onDismissClick = () => {
    setIsOpen(false);
    history.push(
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
        <Page>
          <PageSection variant="light" isFilled>
            <Stack hasGutter>
              <StackItem>
                <div className="lightspeed__welcome-logo" />
                <Title headingLevel="h1" className="pf-v5-u-mb-sm">
                  {t('console-app~Meet OpenShift Lightspeed')}
                </Title>
                <Text className="pf-v5-u-color-200 pf-v5-u-font-size-lg pf-v5-u-mb-md">
                  {t(
                    "console-app~Unlock possibilities and enhance productivity with the AI-powered assistant's expert guidance in your OpenShift web console.",
                  )}
                </Text>
              </StackItem>
              <StackItem isFilled>
                <Title headingLevel="h2" className="pf-v5-u-mb-md">
                  {t('console-app~Benefits:')}
                </Title>
                <List isPlain isBordered className="pf-v5-u-color-200 pf-v5-u-ml-sm">
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
                    {t(
                      'console-app~Free up your IT teams so that you can drive greater innovation',
                    )}
                  </ListItem>
                </List>
              </StackItem>
              {canInstallLightspeed ? (
                <StackItem className="pf-v5-u-text-align-center">
                  <Button variant="primary" size="lg" onClick={onInstallClick}>
                    {t('console-app~Get started in OperatorHub')}
                  </Button>
                </StackItem>
              ) : (
                <StackItem>
                  <Alert
                    variant="info"
                    isInline
                    title={t('console-app~Must have administrator access')}
                  >
                    <Text>
                      {t(
                        'console-app~Contact your administrator and ask them to install Red Hat OpenShift Lightspeed.',
                      )}
                    </Text>
                  </Alert>
                </StackItem>
              )}
              <StackItem className="pf-v5-u-text-align-center">
                <Button variant="link" onClick={onDismissClick}>
                  {t("console-app~Don't show again")}
                </Button>
              </StackItem>
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
