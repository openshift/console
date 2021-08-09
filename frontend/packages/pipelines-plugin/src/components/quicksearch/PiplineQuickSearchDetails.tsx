import * as React from 'react';
import {
  Alert,
  Button,
  ButtonVariant,
  Label,
  LabelGroup,
  Level,
  LevelItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { Dropdown } from '@console/internal/components/utils';
import { handleCta } from '@console/shared';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { CTALabel } from './const';
import {
  getCtaButtonText,
  getTaskCtaType,
  isTaskVersionInstalled,
} from './pipeline-quicksearch-utils';

import './PipelineQuickSearchDetails.scss';

interface PipelineQuickSearchDetailsProps {
  selectedItem: CatalogItem;
  closeModal: () => void;
}

const PipelineQuickSearchDetails: React.FC<PipelineQuickSearchDetailsProps> = ({
  selectedItem,
  closeModal,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [selectedVersion, setSelectedVersion] = React.useState<string>();
  const [buttonText, setButtonText] = React.useState<string>();
  const versions = selectedItem?.attributes?.versions ?? [];
  const versionItems = versions.reduce((acc, { version, id }) => {
    acc[id.toString()] =
      id === selectedItem.data?.latestVersion?.id ? `${version} (latest)` : version;
    return acc;
  }, {});

  const getTaskAlert = React.useMemo(() => {
    const ctaType = getTaskCtaType(selectedItem, selectedVersion);
    switch (ctaType) {
      case CTALabel.Install:
        return (
          <Alert
            className="co-alert"
            variant="info"
            title={t('pipelines-plugin~This version is not installed')}
            isInline
          >
            <p>{t('pipelines-plugin~Adding this task may take a few moments.')}</p>
          </Alert>
        );
      case CTALabel.Update:
        return (
          <Alert className="co-alert" title="Update and Add" variant="warning" isInline>
            <p>{t('pipelines-plugin~Upgrading this task may take a few moments.')}</p>
          </Alert>
        );
      default:
        return null;
    }
  }, [selectedItem, selectedVersion, t]);

  React.useEffect(() => {
    setButtonText(getCtaButtonText(selectedItem, selectedVersion));
  }, [selectedVersion, selectedItem]);

  React.useEffect(() => {
    if (isTaskVersionInstalled(selectedItem)) {
      setSelectedVersion(selectedItem.attributes.installed);
    } else {
      setSelectedVersion(selectedItem.data?.latestVersion?.id?.toString());
    }
  }, [selectedItem]);

  return (
    <>
      <Level hasGutter>
        <LevelItem>
          <Title data-test={'item-name'} headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        <LevelItem>
          <Label data-test={'item-provider'}>{selectedItem.provider}</Label>
        </LevelItem>
      </Level>
      <Split hasGutter>
        <SplitItem>
          <Button
            data-test={'item-cta'}
            variant={ButtonVariant.primary}
            className="opp-quick-search-details__form-button"
            onClick={async (e) => {
              await handleCta(e, selectedItem, closeModal, fireTelemetryEvent, { selectedVersion });
            }}
          >
            {buttonText}
          </Button>
        </SplitItem>
        {
          <SplitItem>
            <Dropdown
              data-test={'item-version'}
              className="opp-quick-search-details__form-button"
              items={versionItems}
              selectedKey={selectedVersion}
              id="dropdown-selectbox"
              dataTest="dropdown-selectbox"
              onChange={(deploymentName) => {
                setSelectedVersion(deploymentName);
              }}
            />
          </SplitItem>
        }
      </Split>
      {getTaskAlert}
      <TextContent className="opp-quick-search-details__description" data-test={'item-description'}>
        {selectedItem.description}
      </TextContent>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('pipelines-plugin~Categories')}
              data-test={'item-category-list'}
            >
              {selectedItem?.attributes?.categories.map((category) => (
                <Label color="blue" key={category} data-test={'item-category-list-item'}>
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup categoryName={t('pipelines-plugin~Tags')} data-test={'item-tag-list'}>
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag} data-test={'item-tag-list-item'}>
                  {tag}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
      </Stack>
    </>
  );
};

export default PipelineQuickSearchDetails;
