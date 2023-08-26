import * as React from 'react';
import { shallow } from 'enzyme';
import { PipelineMetricsLevel } from '../../const';
import PipelineMetricsQuickstart from '../PipelineMetricsQuickstart';
import PipelineMetricsUnsupported from '../PipelineMetricsUnsupported';

describe('Pipeline Metrics unsupported', () => {
  it('Should show PipelineMetricsQuickstart alert', () => {
    const pipelineMetricsUnsupportedWrapper = shallow(
      <PipelineMetricsUnsupported
        updatePermission
        metricsLevel={PipelineMetricsLevel.UNSUPPORTED_LEVEL}
      />,
    );
    expect(pipelineMetricsUnsupportedWrapper.find(PipelineMetricsQuickstart).exists()).toBe(true);
  });

  it('Should not show PipelineMetricsQuickstart alert', () => {
    const pipelineMetricsUnsupportedWrapper = shallow(
      <PipelineMetricsUnsupported
        updatePermission={false}
        metricsLevel={PipelineMetricsLevel.UNSUPPORTED_LEVEL}
      />,
    );
    expect(pipelineMetricsUnsupportedWrapper.find(PipelineMetricsQuickstart).exists()).toBe(false);
  });
});
