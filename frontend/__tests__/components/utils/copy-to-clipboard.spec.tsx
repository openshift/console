import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Tooltip } from 'react-lightweight-tooltip';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';

import { CopyToClipboard, CopyToClipboardProps } from '../../../public/components/utils/copy-to-clipboard';

describe(CopyToClipboard.displayName, () => {
  let wrapper: ShallowWrapper<CopyToClipboardProps>;

  it('displays "Copied" message when clicked', () => {
    wrapper = shallow(<CopyToClipboard value="FizzBuzz" />);
    wrapper.find<any>(CTC).props().onCopy();
    wrapper.update();

    expect(wrapper.find(Tooltip).props().content[0].props.children).toEqual('Copied');
  });

  it('dismisses "Copied" message when mouse moves over button', () => {
    wrapper = shallow(<CopyToClipboard value="FizzBuzz" />);
    wrapper.find<any>(CTC).props().onCopy();
    wrapper.update();

    wrapper.find('.co-copy-to-clipboard__btn').simulate('mouseenter');

    expect(wrapper.find(Tooltip).props().content[0].props.children).toEqual('Copy to Clipboard');
  });
});
