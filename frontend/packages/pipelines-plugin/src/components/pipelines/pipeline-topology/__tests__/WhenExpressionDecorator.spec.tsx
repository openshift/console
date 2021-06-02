import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { runStatus } from '../../../../utils/pipeline-augment';
import WhenExpressionDecorator from '../WhenExpressionDecorator';

type WhenExpressionDecoratorProps = React.ComponentProps<typeof WhenExpressionDecorator>;

describe('WhenExpressionDecorator', () => {
  let wrapper: ShallowWrapper<WhenExpressionDecoratorProps>;
  const whenExpressionContent = (content: string) => {
    return <div data-test="when-expression-tooltip">{content}</div>;
  };
  const props: WhenExpressionDecoratorProps = {
    width: 10,
    height: 10,
    color: 'white',
  };
  beforeEach(() => {
    wrapper = shallow(<WhenExpressionDecorator {...props} />);
  });

  it('should render diamond shape when expression decorator', () => {
    const diamondShape = wrapper.find('rect');
    expect(diamondShape.exists()).toBe(true);
    expect(diamondShape.props().fill).toBe(props.color);
    expect(diamondShape.props().width).toBe(props.width);
    expect(diamondShape.props().height).toBe(props.height);
  });

  it('should not append a line after the diamond shape when appendLine prop is not passed', () => {
    const diamondShape = wrapper.find('rect');
    const connectorLine = wrapper.find('line');
    expect(diamondShape.exists()).toBe(true);
    expect(connectorLine.exists()).toBe(false);
  });

  it('should append a line after the diamond shape when appendLine prop is passed', () => {
    wrapper.setProps({ appendLine: true });
    const diamondShape = wrapper.find('rect');
    const connectorLine = wrapper.find('line');
    expect(diamondShape.exists()).toBe(true);
    expect(connectorLine.exists()).toBe(true);
  });

  it('should not render tooltip when enableTooltip prop is set to false', () => {
    wrapper.setProps({ enableTooltip: false });
    const diamondShape = wrapper.find('rect');
    const tooltip = wrapper.find(Tooltip);
    expect(diamondShape.exists()).toBe(true);
    expect(tooltip.exists()).toBe(false);
  });

  it('should render tooltip when enableTooltip prop is set to true', () => {
    wrapper.setProps({ enableTooltip: true });
    const diamondShape = wrapper.find('rect');
    const tooltip = wrapper.find(Tooltip);
    expect(diamondShape.exists()).toBe(true);
    expect(tooltip.exists()).toBe(true);
  });

  it('should contain the succeeded tooltip content if the task status is succeeded', () => {
    wrapper.setProps({ enableTooltip: true, status: runStatus.Succeeded });
    const tooltip = wrapper.find(Tooltip);
    expect(tooltip.props().content).toEqual(whenExpressionContent('When expression was met'));
  });

  it('should contain the skipped tooltip content if the task status is skipped', () => {
    wrapper.setProps({ enableTooltip: true, status: runStatus.Skipped });
    const tooltip = wrapper.find(Tooltip);
    expect(tooltip.props().content).toEqual(whenExpressionContent('When expression was not met'));
  });

  it('should contain the default tooltip content for other task status', () => {
    wrapper.setProps({ enableTooltip: true, status: runStatus.PipelineNotStarted });

    expect(wrapper.find(Tooltip).props().content).toEqual(whenExpressionContent('When expression'));
    wrapper.setProps({ enableTooltip: true, status: runStatus.Failed });
    expect(wrapper.find(Tooltip).props().content).toEqual(whenExpressionContent('When expression'));
    wrapper.setProps({ enableTooltip: true, status: runStatus.Pending });
    expect(wrapper.find(Tooltip).props().content).toEqual(whenExpressionContent('When expression'));
    wrapper.setProps({ enableTooltip: true, status: runStatus['In Progress'] });
    expect(wrapper.find(Tooltip).props().content).toEqual(whenExpressionContent('When expression'));
  });
});
