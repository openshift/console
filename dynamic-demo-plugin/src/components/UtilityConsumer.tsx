import * as React from "react";
import { consoleFetchJSON, DocumentTitle, ListPageHeader, useToast } from "@openshift-console/dynamic-plugin-sdk";
import { useTranslation } from "react-i18next";
import {
  AlertVariant,
  Button,
  Card,
  CardBody,
  CardTitle,
  Gallery,
  PageSection,
} from "@patternfly/react-core";

const UtilityConsumer: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  const toast = useToast();
  const toastRefs = React.useRef<string[]>([]);

  const showToast = () => {
    const id = toast.addToast({
      title: t("Toast Title"),
      content: t("A great way to start your day is with some toast and a cup of coffee."),
      variant: AlertVariant.success,
    });
    toastRefs.current.push(id);
  };

  const dismissToasts = () => {
    toastRefs.current.forEach((id) => toast.removeToast(id));
    toastRefs.current = [];
  };

  return (
    <>
      <DocumentTitle>{t("Test Utilities")}</DocumentTitle>
      <ListPageHeader data-test="test-utilities-header" title={t("Utilities from Dynamic Plugin SDK")} />
      <PageSection>
        <Gallery hasGutter minWidths={{ default: "100%" }}>
          <Card>
            <CardTitle data-test="test-utility-card">{t("Utility: consoleFetchJSON")}</CardTitle>
            <CardBody data-test="test-utility-fetch">
              <ConsoleFetchConsumer />
            </CardBody>
          </Card>
          <Card>
            <CardTitle data-test="test-utility-card">{t("Utility: useToast")}</CardTitle>
            <CardBody data-test="test-utility-toast">
              <Button onClick={showToast}>{t("Show Toast")}</Button>
              <Button onClick={dismissToasts} variant="link">
                {t("Dismiss Toasts")}
              </Button>
            </CardBody>
          </Card>
        </Gallery>
      </PageSection>
    </>
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
