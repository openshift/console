import * as React from 'react';
import {
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
import { CheckCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { handleCta } from '@console/shared';
import { QuickSearchDetailsRendererProps } from '@console/shared/src/components/quick-search/QuickSearchDetails';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import {
  getCtaButtonText,
  getTaskCtaType,
  isOneVersionInstalled,
  isTaskVersionInstalled,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchTaskAlert from './PipelineQuickSearchTaskAlert';
import PipelineQuickSearchVersionDropdown from './PipelineQuickSearchVersionDropdown';

import './PipelineQuickSearchDetails.scss';

const PipelineQuickSearchDetails: React.FC<QuickSearchDetailsRendererProps> = ({
  selectedItem,
  closeModal,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [selectedVersion, setSelectedVersion] = React.useState<string>();
  const versions = selectedItem?.attributes?.versions ?? [];

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
          <Title data-test="task-name" headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        <LevelItem>
          <Label data-test="task-provider">{selectedItem.provider}</Label>
        </LevelItem>
      </Level>
      <Level hasGutter>
        <LevelItem>
          <Split hasGutter>
            <SplitItem>
              <Button
                data-test="task-cta"
                variant={ButtonVariant.primary}
                className="opp-quick-search-details__form-button"
                onClick={(e) => {
                  handleCta(e, selectedItem, closeModal, fireTelemetryEvent, { selectedVersion });
                }}
              >
                {getCtaButtonText(selectedItem, selectedVersion)}
              </Button>
            </SplitItem>
            {versions.length > 0 && (
              <SplitItem data-test="task-version-dropdown">
                <PipelineQuickSearchVersionDropdown
                  item={selectedItem}
                  selectedVersion={selectedVersion}
                  onChange={(key) => setSelectedVersion(key)}
                />
              </SplitItem>
            )}
          </Split>
        </LevelItem>
        {isOneVersionInstalled(selectedItem) && (
          <LevelItem>
            <Label color="green" icon={<CheckCircleIcon />} data-test="task-installed-badge">
              {t('pipelines-plugin~Installed')}
            </Label>
          </LevelItem>
        )}
      </Level>
      {<PipelineQuickSearchTaskAlert ctaType={getTaskCtaType(selectedItem, selectedVersion)} />}
      <TextContent className="opp-quick-search-details__description" data-test="task-description">
        {selectedItem.description}
      </TextContent>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('pipelines-plugin~Categories')}
              data-test="task-category-list"
            >
              {selectedItem?.attributes?.categories.map((category) => (
                <Label color="blue" key={category} data-test="task-category-list-item">
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup categoryName={t('pipelines-plugin~Tags')} data-test="task-tag-list">
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag} data-test="task-tag-list-item">
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
