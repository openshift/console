import * as React from "react";
import { consoleFetchJSON, DocumentTitle } from "@openshift-console/dynamic-plugin-sdk";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardTitle,
  PageSection,
  Title,
} from "@patternfly/react-core";
import { getConsoleRequestHeaders } from "@openshift-console/dynamic-plugin-sdk/lib/utils/fetch";
const UtilityConsumer: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  return (
    <>
      <DocumentTitle>{t("Test Utilities")}</DocumentTitle>
      <PageSection>
        <Title headingLevel="h1" data-test="test-utilities-title">
          {t("Utilities from Dynamic Plugin SDK")}
        </Title>
      </PageSection>
      <PageSection>
        <Card>
          <CardTitle data-test="test-utility-card">{t("Utility: consoleFetchJSON")}</CardTitle>
          <CardBody data-test="test-utility-fetch">
            <ConsoleFetchConsumer />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

const ConsoleFetchConsumer: React.FC = () => {
  const [data, setData] = React.useState();

  console.log('haha about to call the utility function');
  const consoleHeaders = getConsoleRequestHeaders();
  console.log('haha consoleHeaders in utility function', consoleHeaders);

  React.useEffect(() => {
    consoleFetchJSON("/api/kubernetes/version")
      .then((response) => {
        setData(response);
      })
      .catch((e) => console.error(e));
  }, []);

    return <div>
    <p>Console Headers</p>
    <pre>{JSON.stringify(consoleHeaders, null, 2)}</pre>
    <p>Console Fetch response</p>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>;
};

export default UtilityConsumer;
