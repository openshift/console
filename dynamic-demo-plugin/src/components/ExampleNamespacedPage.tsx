import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  Flex,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { DocumentTitle, NamespaceBar } from '@openshift-console/dynamic-plugin-sdk';

const NamespacePageContent = ({ namespace }: { namespace?: string }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');

  return (
    <>
      <DocumentTitle>{t('Example Namespaced Page')}</DocumentTitle>
      <PageSection>
        <Title headingLevel="h1">{t('Example page with a namespace bar')}</Title>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              justifyContent={{ default: 'justifyContentCenter' }}
              grow={{ default: 'grow' }}
              direction={{ default: 'column' }}
            >
              <Title headingLevel='h1'>{t('Currently selected namespace')}</Title>
              <Title headingLevel='h2'>{namespace}</Title>
            </Flex>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export const ExampleNamespacedPage: React.FC = () => {
  const { ns } = useParams<'ns'>();
  const activeNamespace = ns || 'all-namespaces';

  return (
    <>
      <NamespaceBar />
      <NamespacePageContent namespace={activeNamespace} />
    </>
  );
};
