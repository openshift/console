import * as React from 'react';
import { Button, ButtonVariant, Popover } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import './PipelineWorkspaceSuggestionIcon.scss';

const PipelineWorkspaceSuggestionIcon: React.FC = () => {
  const { t } = useTranslation();

  const ariaLabel = t('pipelines-plugin~Open hint');
  const content = t(
    "pipelines-plugin~Resources aren't in beta, so it is recommended to use workspaces instead.",
  );

  return (
    <Popover aria-label={content} bodyContent={content}>
      <Button isInline variant={ButtonVariant.link} aria-label={ariaLabel}>
        <InfoCircleIcon className="opp-pipeline-workspace-suggestion-icon" />
      </Button>
    </Popover>
  );
};

export default PipelineWorkspaceSuggestionIcon;
