import * as React from "react";
import * as _ from "lodash";
import { useTranslation } from "react-i18next";
import {
  useResolvedExtensions,
  isModelFeatureFlag,
  ModelFeatureFlag,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Page,
  PageSection,
  Title,
} from "@patternfly/react-core";

const ExtensionConsumer: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(
    isModelFeatureFlag
  );

  return extensions.length ? (
    <Page
      additionalGroupedContent={
        <PageSection variant="light">
          <Title headingLevel="h1">
            {t("Extensions of type Console.flag/Model")}
          </Title>
        </PageSection>
      }
    >
      <PageSection>
        {extensions.map((ext) => (
          <Card key={ext.properties.flag}>
            <CardTitle>{ext.properties.flag}</CardTitle>
            <CardBody>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t("Group")}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {ext.properties.model.group}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t("Version")}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {ext.properties.model.version}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t("Kind")}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {ext.properties.model.kind}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        ))}
      </PageSection>
    </Page>
  ) : null;
};

export default ExtensionConsumer;
