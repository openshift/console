import { Status } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { BuildModel } from '@console/internal/models';
import { PipelineRunModel } from '../../../../../../models';
import { getBuildDecoratorParts } from '../build-decorator-utils';
import PipelineBuildDecoratorTooltip from '../PipelineBuildDecoratorTooltip';
import {
  bareMinimalWorkloadData,
  buildAndPipelineData,
  buildOnlyData,
} from './build-decorator-utils-data';

describe('build-decorator-utils', () => {
  it('expect get build decorator parts to return nothing when giving insufficient data', () => {
    const missingData = getBuildDecoratorParts(bareMinimalWorkloadData);

    expect(missingData.decoratorIcon).toBeNull();
    expect(missingData.linkRef).toBeNull();
    expect(missingData.tooltipContent).toBeNull();
  });

  it('expect get build decorator parts to return pipeline-specific when providing both build and pipeline', () => {
    const buildAndPipeline = getBuildDecoratorParts(buildAndPipelineData);

    // Got back data
    expect(buildAndPipeline.decoratorIcon).not.toBeNull();
    expect(buildAndPipeline.linkRef).not.toBeNull();
    expect(buildAndPipeline.tooltipContent).not.toBeNull();

    // The data is Pipeline
    expect(buildAndPipeline.decoratorIcon.type).toBe(Status);
    expect(buildAndPipeline.decoratorIcon.props.status).toBe('Succeeded');
    expect(buildAndPipeline.linkRef).toContain(referenceForModel(PipelineRunModel));
    expect(buildAndPipeline.linkRef).toContain('/logs'); // make sure it goes to the log page
    expect(buildAndPipeline.tooltipContent.type).toBe(PipelineBuildDecoratorTooltip);
  });

  it('expect getBuildDecorator to return build-specific when not providing pipeline data', () => {
    const buildOnly = getBuildDecoratorParts(buildOnlyData);

    // Got back data
    expect(buildOnly.decoratorIcon).not.toBeNull();
    expect(buildOnly.linkRef).not.toBeNull();
    expect(buildOnly.tooltipContent).not.toBeNull();

    // The data is Pipeline
    expect(buildOnly.decoratorIcon.type).toBe(Status);
    expect(buildOnly.decoratorIcon.props.status).toBe('Running');
    expect(buildOnly.linkRef).toContain(BuildModel.plural);
    expect(buildOnly.linkRef).toContain('/logs'); // make sure it goes to the log page
    expect(typeof buildOnly.tooltipContent).toBe('string');
  });
});
