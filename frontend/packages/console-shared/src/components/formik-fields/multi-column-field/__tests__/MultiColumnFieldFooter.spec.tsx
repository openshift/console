import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import MultiColumnFieldFooter from '../MultiColumnFieldFooter';

describe('MultiColumnFieldFooter', () => {
  it('should render an enabled add button by default, but without a tooltip', () => {
    const footer = shallow(<MultiColumnFieldFooter onAdd={jest.fn()} />);

    const pfButton = footer.find(Button);
    expect(pfButton.exists()).toBeTruthy();
    expect(pfButton.props().children).toBe('Add values');
    expect(pfButton.props().disabled).toBeFalsy();
    expect(pfButton.props()['aria-disabled']).toBeFalsy();

    const pfTooltip = footer.find(Tooltip);
    expect(pfTooltip.exists()).toBeFalsy();
  });

  it('should render an disabled button without a tooltip when disableAddRow is true', () => {
    const footer = shallow(<MultiColumnFieldFooter onAdd={jest.fn()} disableAddRow />);

    const pfButton = footer.find(Button);
    expect(pfButton.exists()).toBeTruthy();
    expect(pfButton.props().children).toBe('Add values');
    expect(pfButton.props().disabled).toBeFalsy();
    expect(pfButton.props().isAriaDisabled).toBeTruthy();

    const pfTooltip = footer.find(Tooltip);
    expect(pfTooltip.exists()).toBeFalsy();
  });

  it('should render an disabled button with a tooltip when disableAddRow is true', () => {
    const footer = shallow(
      <MultiColumnFieldFooter
        onAdd={jest.fn()}
        disableAddRow
        tooltipAddRow="Disabled add button"
      />,
    );

    const pfButton = footer.find(Button);
    expect(pfButton.exists()).toBeTruthy();
    expect(pfButton.props().children).toBe('Add values');
    expect(pfButton.props().disabled).toBeFalsy();
    expect(pfButton.props().isAriaDisabled).toBeTruthy();

    const pfTooltip = footer.find(Tooltip);
    expect(pfTooltip.exists()).toBeTruthy();
    expect(pfTooltip.props().content).toBe('Disabled add button');
  });
});
