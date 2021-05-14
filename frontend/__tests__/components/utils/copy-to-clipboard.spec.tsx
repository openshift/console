import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Tooltip } from '@patternfly/react-core';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';

import {
  CopyToClipboard,
  CopyToClipboardProps,
} from '../../../public/components/utils/copy-to-clipboard';

describe(CopyToClipboard.displayName, () => {
  let wrapper: ShallowWrapper<CopyToClipboardProps>;

  it('displays "Copied" message when clicked', () => {
    wrapper = shallow(<CopyToClipboard value="FizzBuzz" />);
    wrapper
      .find<any>(CTC)
      .props()
      .onCopy();

    // re-render component created via React.memo
    wrapper.setProps({ value: 'FuzzBizz' });

    expect(wrapper.find(Tooltip).props().content[0].props.children).toEqual(`Copied`);
  });

  it('dismisses "Copied" message when mouse moves over button', () => {
    wrapper = shallow(<CopyToClipboard value="FizzBuzz" />);
    wrapper
      .find<any>(CTC)
      .props()
      .onCopy();

    wrapper.find('.co-copy-to-clipboard__btn').simulate('mouseenter');

    expect(wrapper.find(Tooltip).props().content[0].props.children).toEqual(`Copy to clipboard`);
  });
});
