import * as React from 'react';
import {
  CriticalRiskIcon,
  AngleDoubleDownIcon,
  AngleDoubleUpIcon,
  EqualsIcon,
} from '@patternfly/react-icons/dist/js/icons';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as goldColor } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orangeColor } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_palette_red_200 as redColor } from '@patternfly/react-tokens/dist/js/global_palette_red_200';
import i18n from 'i18next';
import { PipelineRunKind } from '../../../types';
import { usePipelineRunVulnerabilities } from '../hooks/usePipelineRunVulnerabilities';

import './PipelineRunVulnerabilities.scss';

export const CriticalIcon = () => <CriticalRiskIcon title="Critical" color={redColor.value} />;
export const HighIcon = () => <AngleDoubleUpIcon title="High" color={orangeColor.value} />;
export const MediumIcon = () => <EqualsIcon title="Medium" color={goldColor.value} />;
export const LowIcon = () => <AngleDoubleDownIcon title="Low" color={blueColor.value} />;

type PipelineRunVulnerabilitiesProps = {
  pipelineRun: PipelineRunKind;
  condensed?: boolean;
};

const PipelineRunVulnerabilities: React.FC<PipelineRunVulnerabilitiesProps> = ({
  pipelineRun,
  condensed,
}) => {
  const scanResults = usePipelineRunVulnerabilities(pipelineRun);

  return scanResults?.vulnerabilities ? (
    <div
      className="opp-vulnerabilities"
      data-test={`${pipelineRun?.metadata?.name}-vulnerabilities`}
    >
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <CriticalIcon />
          {!condensed ? i18n.t('pipelines-plugin~Critical') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.critical}
        </span>
      </div>
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <HighIcon />
          {!condensed ? i18n.t('pipelines-plugin~High') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.high}
        </span>
      </div>
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <MediumIcon />
          {!condensed ? i18n.t('pipelines-plugin~Medium') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.medium}
        </span>
      </div>
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <LowIcon />
          {!condensed ? i18n.t('pipelines-plugin~Low') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.low}
        </span>
      </div>
    </div>
  ) : (
    <div>-</div>
  );
};

export default PipelineRunVulnerabilities;
