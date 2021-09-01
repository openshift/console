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
  Page,
  PageSection,
  Stack,
  Title,
} from "@patternfly/react-core";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const ExamplePage: React.FC<{ title: string }> = ({ title }) => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  return (
    <Page
      additionalGroupedContent={
        <PageSection variant="light">
          <Title headingLevel="h1">{title}</Title>
        </PageSection>
      }
      groupProps={{ sticky: "top" }}
    >
      <PageSection>
        <Stack hasGutter>
          <AlertGroup>
            <Alert title={t("Example info alert")} variant="info" isInline />
            <Alert
              title={t("Example warning alert")}
              variant="warning"
              isInline
            />
          </AlertGroup>
          <Hint>
            <HintTitle>{t("Example hint")}</HintTitle>
            <HintBody>
              {t("This page shows an example gallery view with cards")}
            </HintBody>
          </Hint>
          <Gallery hasGutter>
            {new Array(50).fill(0).map((_, index) => (
              <GalleryItem key={index}>
                <Card>
                  <CardTitle>{t("Example card")}</CardTitle>
                  <CardBody>{t("Card content goes here.")}</CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        </Stack>
      </PageSection>
    </Page>
  );
};

export default ExamplePage;
