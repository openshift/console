import * as React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';

const CopyPipelineRunButton = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const { t } = useTranslation();
  const tooltipText = copied
    ? t('pipelines-plugin~Copied to clipboard')
    : t('pipelines-plugin~Copy to clipboard');
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];

  return (
    <div data-test="pipelinerun-copy-btn">
      <Tooltip content={tooltipContent} trigger="click mouseenter focus" exitDelay={1250}>
        <CTC text={text} onCopy={() => setCopied(true)}>
          <span onMouseEnter={() => setCopied(false)}>
            <Button
              type="button"
              variant="secondary"
              className="pf-c-button--align-right hidden-sm hidden-xs"
            >
              <CopyIcon /> {t('pipelines-plugin~Copy')}
            </Button>
          </span>
        </CTC>
      </Tooltip>
    </div>
  );
};

export default CopyPipelineRunButton;
