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
import { ExternalLink } from '@console/internal/components/utils';
import { handleCta } from '@console/shared';
import { QuickSearchDetailsRendererProps } from '@console/shared/src/components/quick-search/QuickSearchDetails';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { getHubUIPath, getTektonHubTaskVersions } from '../catalog/apis/tektonHub';
import {
  getCtaButtonText,
  getTaskCtaType,
  isOneVersionInstalled,
  isTaskVersionInstalled,
  isTektonHubTaskWithoutVersions,
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
  const [versions, setVersions] = React.useState(selectedItem?.attributes?.versions ?? []);
  const [hasInstalledVersion, setHasInstalledVersion] = React.useState<boolean>(
    isOneVersionInstalled(selectedItem),
  );

  const resetVersions = React.useCallback(() => {
    setVersions(selectedItem?.attributes?.versions ?? []);
    setSelectedVersion(selectedItem?.attributes?.installed ?? '');
    setHasInstalledVersion(isOneVersionInstalled(selectedItem));
  }, [selectedItem]);

  React.useEffect(() => {
    resetVersions();
    let mounted = true;
    if (isTektonHubTaskWithoutVersions(selectedItem)) {
      getTektonHubTaskVersions(selectedItem.data.id)
        .then((itemVersions = []) => {
          if (mounted) {
            setVersions([...itemVersions]);
            selectedItem.attributes.versions = itemVersions;
            setHasInstalledVersion(isOneVersionInstalled(selectedItem));
          }
        })
        .catch((err) => {
          if (mounted) {
            resetVersions();
          }
          console.log('failed to fetch versions:', err); // eslint-disable-line no-console
        });
    }

    return () => (mounted = false);
  }, [resetVersions, selectedItem]);

  React.useEffect(() => {
    if (isTaskVersionInstalled(selectedItem)) {
      setSelectedVersion(selectedItem.attributes.installed);
    } else {
      setSelectedVersion(selectedItem.data?.latestVersion?.version?.toString());
    }
  }, [selectedItem]);
  const loadedVersion = React.useMemo(
    () => versions?.find((version) => version.version?.toString() === selectedVersion),
    [selectedVersion, versions],
  );

  const hubLink = getHubUIPath(loadedVersion?.hubURLPath);

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
                isDisabled={versions.length === 0}
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
                  key={selectedItem.uid}
                  versions={versions}
                  item={selectedItem}
                  selectedVersion={selectedVersion}
                  onChange={(key) => setSelectedVersion(key)}
                />
              </SplitItem>
            )}
          </Split>
        </LevelItem>
        {hasInstalledVersion && (
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
        {hubLink && (
          <ExternalLink
            additionalClassName="opp-quick-search-details__hublink"
            dataTestID="task-hub-link"
            href={hubLink}
            text={t('pipelines-plugin~Read more')}
          />
        )}
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
