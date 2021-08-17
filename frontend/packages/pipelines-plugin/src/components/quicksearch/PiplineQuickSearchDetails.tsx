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
import { Dropdown } from '@console/internal/components/utils';
import { handleCta } from '@console/shared';
import { QuickSearchDetailsRendererProps } from '@console/shared/src/components/quick-search/QuickSearchDetails';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { CTALabel } from './const';
import {
  getCtaButtonText,
  getTaskCtaType,
  isTaskVersionInstalled,
} from './pipeline-quicksearch-utils';

import './PipelineQuickSearchDetails.scss';

const PipelineQuickSearchDetails: React.FC<QuickSearchDetailsRendererProps> = ({
  selectedItem,
  closeModal,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [selectedVersion, setSelectedVersion] = React.useState<string>();
  const [ctaType, setCtaType] = React.useState<string>();
  const [buttonText, setButtonText] = React.useState<string>();
  const versions = selectedItem?.attributes?.versions ?? [];
  const versionItems = versions.reduce((acc, { version, id }) => {
    acc[id.toString()] =
      id === selectedItem.data?.latestVersion?.id ? `${version} (latest)` : version;
    return acc;
  }, {});

  const getTaskAlert = React.useMemo(() => {
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
  }, [ctaType, t]);

  React.useEffect(() => {
    setButtonText(getCtaButtonText(selectedItem, selectedVersion));
    setCtaType(getTaskCtaType(selectedItem, selectedVersion));
  }, [selectedVersion, selectedItem]);

  React.useEffect(() => {
    if (isTaskVersionInstalled(selectedItem)) {
      setSelectedVersion(selectedItem.attributes.installed);
    } else {
      setSelectedVersion(selectedItem.data?.latestVersion?.id?.toString());
    }
  }, [selectedItem]);

  return (
    <div className="opp-quick-search-details">
      <Level hasGutter>
        <LevelItem>
          <Title data-test={'task-name'} headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        <LevelItem>
          <Label data-test={'task-provider'}>{selectedItem.provider}</Label>
        </LevelItem>
      </Level>
      <Split hasGutter>
        <SplitItem>
          <Button
            data-test={'task-cta'}
            variant={ButtonVariant.primary}
            className="opp-quick-search-details__form-button"
            onClick={(e) => {
              handleCta(e, selectedItem, closeModal, fireTelemetryEvent, { selectedVersion });
            }}
          >
            {buttonText}
          </Button>
        </SplitItem>
        {versions.length > 0 && (
          <SplitItem>
            <Dropdown
              data-test={'task-version'}
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
        )}
      </Split>
      {getTaskAlert}
      <TextContent className="opp-quick-search-details__description" data-test={'task-description'}>
        {selectedItem.description}
      </TextContent>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('pipelines-plugin~Categories')}
              data-test={'task-category-list'}
            >
              {selectedItem?.attributes?.categories.map((category) => (
                <Label color="blue" key={category} data-test={'task-category-list-item'}>
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup categoryName={t('pipelines-plugin~Tags')} data-test={'task-tag-list'}>
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag} data-test={'task-tag-list-item'}>
                  {tag}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
      </Stack>
    </div>
  );
};

export default PipelineQuickSearchDetails;
