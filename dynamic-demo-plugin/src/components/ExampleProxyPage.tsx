import * as React from 'react';
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from "react-i18next";

import {
  Card,
  CardBody,
  CardTitle,
  Page,
  PageSection,
  Title,
} from "@patternfly/react-core";

const ExampleProxyPage: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  return (
    <Page
      additionalGroupedContent={
        <PageSection variant="light">
          <Title headingLevel="h1">
            {t("Dynamic Plugin Proxy Services example")}
          </Title>
        </PageSection>
      }
    >
      <PageSection>
        <Card>
          <CardTitle>{t("Proxy: consoleFetchJSON")}</CardTitle>
          <CardBody>
          <ExampleProxyResponse />
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

const ExampleProxyResponse: React.FC = () => {
  const [data, setData] = React.useState();

  React.useEffect(() => {
    consoleFetchJSON('/api/proxy/plugin/console-demo-plugin/thanos-querier/api/v1/rules')
      .then((response) => {
        setData(response);
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
};

export default ExampleProxyPage;
