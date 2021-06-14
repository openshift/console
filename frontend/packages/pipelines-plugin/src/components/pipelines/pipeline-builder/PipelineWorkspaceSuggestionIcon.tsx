import * as React from 'react';
import { Popover } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import './PipelineWorkspaceSuggestionIcon.scss';

const PipelineWorkspaceSuggestionIcon: React.FC = () => {
  const { t } = useTranslation();

  const content = t(
    "pipelines-plugin~Resources aren't in beta, so it is recommended to use workspaces instead.",
  );

  return (
    <Popover aria-label={content} bodyContent={content}>
      <InfoCircleIcon className="opp-pipeline-workspace-suggestion-icon" />
    </Popover>
  );
};

export default PipelineWorkspaceSuggestionIcon;
