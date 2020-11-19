import * as React from 'react';
import { shallow } from 'enzyme';
import BuildDecorator from '../BuildDecorator';
import BuildConfigDecorator from '../BuildConfigDecorator';
import { noPipelineData, pipelineData } from './decorator-data';
import PipelineRunDecorator from '../PipelineRunDecorator';

describe('BuildDecorator renders', () => {
  it('expect BuildDecorator by default', () => {
    const comp = shallow(
      <BuildDecorator resource={null} workloadData={noPipelineData} radius={0} x={0} y={0} />,
    );
    expect(comp.find(BuildConfigDecorator).exists()).toBe(true);
  });

  it('expect PipelineRunDecorator if a connectedPipeline is provided', () => {
    const comp = shallow(
      <BuildDecorator resource={null} workloadData={pipelineData} radius={0} x={0} y={0} />,
    );
    expect(comp.find(PipelineRunDecorator).exists()).toBe(true);
  });
});
