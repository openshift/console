import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router-dom';
import {
  Card,
  CardBody,
  Flex,
  Page,
  PageSection,
  PageSectionVariants,
  Title,
} from '@patternfly/react-core';
import { NamespaceBar } from '@openshift-console/dynamic-plugin-sdk';

const NamespacePageContent = ({ namespace }: { namespace?: string }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');

  return (
    <Page>
      <PageSection variant={PageSectionVariants.light}>
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
              <h1>{t('Currently selected namespace')}</h1>
              <h2>{namespace}</h2>
            </Flex>
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

export const ExampleNamespacedPage: React.FC<ExampleNamespacedPageProps> = ({ match }) => {
  const { ns } = match?.params;
  const activeNamespace = ns || 'all-namespaces';

  return (
    <>
      <NamespaceBar />
      <NamespacePageContent namespace={activeNamespace} />
    </>
  );
};

type ExampleNamespacedPageProps = {
  match: RMatch<{
    ns?: string;
  }>;
};
