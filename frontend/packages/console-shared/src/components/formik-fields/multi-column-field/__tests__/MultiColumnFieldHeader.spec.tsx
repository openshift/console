import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { gridItemSpanValueShape } from '@patternfly/react-core';
import MultiColumnFieldHeader, { MultiColumnFieldHeaderProps } from '../MultiColumnFieldHeader';

describe('MultiColumnFieldHeader', () => {
  let headerProps: MultiColumnFieldHeaderProps;
  let wrapper: ShallowWrapper<MultiColumnFieldHeaderProps>;

  beforeEach(() => {
    headerProps = {
      headers: [
        {
          name: 'Test Field',
          required: true,
        },
      ],
      spans: [12 as gridItemSpanValueShape],
    };
    wrapper = shallow(<MultiColumnFieldHeader {...headerProps} />);
  });

  it('should render required label when prop is of type Object[] with property required set to true', () => {
    expect(wrapper.contains('*')).toBe(true);
  });

  it('should not render required label when prop is of type string[]', () => {
    headerProps.headers = ['Testing Field'];
    wrapper = shallow(<MultiColumnFieldHeader {...headerProps} />);
    expect(wrapper.contains('*')).toBe(false);
  });
});
