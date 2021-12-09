import * as React from "react";
import { consoleFetchJSON } from "@openshift-console/dynamic-plugin-sdk";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardTitle,
  Page,
  PageSection,
  Title,
} from "@patternfly/react-core";

const UtilityConsumer: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  return (
    <Page
      additionalGroupedContent={
        <PageSection variant="light">
          <Title headingLevel="h1" data-test="test-utilities-title">
            {t("Utilities from Dynamic Plugin SDK")}
          </Title>
        </PageSection>
      }
    >
      <PageSection>
        <Card>
          <CardTitle data-test="test-utility-card">{t("Utility: consoleFetchJSON")}</CardTitle>
          <CardBody data-test="test-utility-fetch">
            <ConsoleFetchConsumer />
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

const ConsoleFetchConsumer: React.FC = () => {
  const [data, setData] = React.useState();

  React.useEffect(() => {
    consoleFetchJSON("/api/kubernetes/version")
      .then((response) => {
        setData(response);
      })
      .catch((e) => console.error(e));
  }, []);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

export default UtilityConsumer;
