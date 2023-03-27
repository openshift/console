import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import ResultsList from '../../shared/results/ResultsList';
import PipelineRunDetailsSection from './PipelineRunDetailsSection';
import './TriggeredBySection.scss';

export interface PipelineRunDetailsProps {
  obj: PipelineRunKind;
}

export const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({ obj: pipelineRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body odc-pipeline-run-details">
        <PipelineRunDetailsSection pipelineRun={pipelineRun} />
      </div>

      {pipelineRun.status?.pipelineResults && (
        <div className="co-m-pane__body">
          <ResultsList
            results={pipelineRun.status?.pipelineResults}
            resourceName={t(PipelineRunModel.labelKey)}
            status={pipelineRunFilterReducer(pipelineRun)}
          />
        </div>
      )}
    </>
  );
};
