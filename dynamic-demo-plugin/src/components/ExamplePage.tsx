import * as React from 'react';
import {
  Alert,
  AlertGroup,
  Card,
  CardBody,
  CardTitle,
  Gallery,
  GalleryItem,
  Hint,
  HintBody,
  HintTitle,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DocumentTitle, usePrometheusPoll, PrometheusEndpoint } from '@openshift-console/dynamic-plugin-sdk';

export const ExamplePage: React.FC<{ title: string }> = ({ title }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');

  const [result, loaded, error] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: 'sum(http_requests_total)',
  });

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageSection>
        <Title headingLevel="h1" data-test="title">{title}</Title>
      </PageSection>
      <PageSection>
        <Stack hasGutter>
          <AlertGroup>
            <Alert title={t('Example info alert')} variant="info" isInline data-test="alert-info" />
            <Alert title={t('Example warning alert')} variant="warning" isInline data-test="alert-warning" />
          </AlertGroup>
          <Hint data-test="hint">
            <HintTitle>{t('Example hint')}</HintTitle>
            <HintBody>{t('This page shows an example gallery view with cards')}</HintBody>
          </Hint>
          <Gallery hasGutter>
            {new Array(50).fill(0).map((_, index) => (
              <GalleryItem key={index}>
                <Card data-test="card">
                  <CardTitle>{t('Example card')}</CardTitle>
                  <CardBody>{t('Card content goes here.')}</CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
          <StackItem>
            {error && (
              <Alert variant="warning" data-test="demo-plugin_prometheus-error" title={t('Prometheus error')}>
                {error instanceof Error ? error.message : String(error)}
              </Alert>
            )}
            {!loaded && (
              <Alert
                variant="info"
                data-test="demo-plugin_prometheus-loading"
                title={t('Prometheus loading')}
              >
                {t('Prometheus loading')}
              </Alert>
            )}
            {!error && loaded && (
              <Alert data-test="demo-plugin_prometheus-data" title={t('Prometheus data')}>
                {JSON.stringify(result.data)}
              </Alert>
            )}
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default ExamplePage;
