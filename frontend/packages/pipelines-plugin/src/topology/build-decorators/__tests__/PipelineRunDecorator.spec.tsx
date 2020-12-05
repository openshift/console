import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import * as utils from '@console/internal/components/utils';
import { BuildDecoratorBubble } from '@console/topology/src/components/graph-view';
import { ConnectedPipelineRunDecorator } from '../PipelineRunDecorator';
import { connectedPipelineOne } from './decorator-data';

describe('PipelineRunDecorator renders', () => {
  let spyUseAccessReview;
  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
  });

  it('expect a log link when it contains at least one PipelineRun', () => {
    const decoratorComp = shallow(
      <ConnectedPipelineRunDecorator
        pipeline={connectedPipelineOne.pipeline}
        pipelineRuns={connectedPipelineOne.pipelineRuns}
        radius={0}
        x={0}
        y={0}
      />,
    );
    const linkComp = decoratorComp.find(Link);
    expect(linkComp.exists()).toBe(true);
  });

  it('expect not to find a Link component when there is no PipelineRuns associated', () => {
    const decoratorComp = shallow(
      <ConnectedPipelineRunDecorator
        pipeline={connectedPipelineOne.pipeline}
        pipelineRuns={[]}
        radius={0}
        x={0}
        y={0}
      />,
    );
    expect(decoratorComp.find(Link).exists()).toBe(false);
    expect(decoratorComp.find(BuildDecoratorBubble).props().onClick).not.toBe(null);
  });

  it('expect not to find an onClick functionality when there is a lack of permissions', () => {
    spyUseAccessReview.mockReturnValue(false);
    const decoratorComp = shallow(
      <ConnectedPipelineRunDecorator
        pipeline={connectedPipelineOne.pipeline}
        pipelineRuns={[]}
        radius={0}
        x={0}
        y={0}
      />,
    );
    expect(decoratorComp.find(Link).exists()).toBe(false);
    expect(decoratorComp.find(BuildDecoratorBubble).props().onClick).toBe(null);
  });
});
