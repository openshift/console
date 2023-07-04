import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import * as intellijImg from '@console/internal/imgs/logos/intellij.png';
import * as vscodeImg from '@console/internal/imgs/logos/vscode.png';
import ExtensionCard from './ExtensionCard';

const ExtensionCards: React.FC<{}> = () => {
  const { t } = useTranslation();

  return (
    <Flex direction={{ default: 'column', sm: 'row' }} spaceItems={{ default: 'spaceItemsNone' }}>
      <FlexItem
        className="odc-serverless-extensions-card"
        flex={{ default: 'flex_1' }}
        data-test="odc-serverless-vscode-extension-card"
      >
        <ExtensionCard
          icon={vscodeImg}
          link="https://marketplace.visualstudio.com/items?itemName=redhat.vscode-openshift-connector"
          title={t('devconsole~VSCode')}
          description={t(
            'devconsole~The OpenShift Serverless Functions support in the VSCode IDE extension enables developers to effortlessly create, build, run, invoke and deploy serverless functions on OpenShift, providing a seamless development experience within the familiar VSCode environment.',
          )}
          provider={t('devconsole~Provided by Red Hat')}
        />
      </FlexItem>
      <FlexItem
        className="odc-serverless-extensions-card"
        flex={{ default: 'flex_1' }}
        data-test="odc-serverless-intellij-extension-card"
      >
        <ExtensionCard
          icon={intellijImg}
          link="https://plugins.jetbrains.com/plugin/16476-knative--serverless-functions-by-red-hat"
          title={t('devconsole~IntelliJ')}
          description={t(
            'devconsole~A plugin for working with Knative on a OpenShift or Kubernetes cluster. This plugin allows developers to view and deploy their applications in a serverless way.',
          )}
          provider={t('devconsole~Provided by Red Hat')}
        />
      </FlexItem>
    </Flex>
  );
};

export default ExtensionCards;
