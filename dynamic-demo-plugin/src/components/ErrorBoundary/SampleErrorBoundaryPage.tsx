import * as React from 'react';
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, CardTitle, Page, PageSection, Title } from "@patternfly/react-core";
import { ErrorBoundaryFallbackPage } from '@openshift-console/dynamic-plugin-sdk';
import { DemoErrorBoundary }  from './DemoErrorBoundary';

const BuggyComponent: React.FC = () => {
    throw new Error('test error');
}

const SampleErrorBoundaryPage: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  const [ isBuggyComponentRendered, setBuggyComponentRendered ] = React.useState(false);
  const onClick = () => {setBuggyComponentRendered(!isBuggyComponentRendered)};

  return (
    <DemoErrorBoundary FallbackComponent={ErrorBoundaryFallbackPage}>
        <Page
          additionalGroupedContent={
            <PageSection variant="light">
                <Title headingLevel="h1">{t('Sample Error Boundary Page')}</Title>
            </PageSection>
          }
        >
          <PageSection>
            <Card>
              <CardTitle>{t("Create an exception")}</CardTitle>
              <CardBody>
                  <Button onClick={onClick}>{t('Launch buggy component')}</Button>
                  {isBuggyComponentRendered && <BuggyComponent/>}
              </CardBody>
            </Card>
          </PageSection>
        </Page>
    </DemoErrorBoundary>
  );
};

export default SampleErrorBoundaryPage;
