import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Tooltip } from '@patternfly/react-core';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { act } from 'react-dom/test-utils';

import {
  CopyToClipboard,
  CopyToClipboardProps,
} from '../../../public/components/utils/copy-to-clipboard';

describe(CopyToClipboard.displayName, () => {
  let wrapper: ReactWrapper<CopyToClipboardProps>;

  it('displays "Copied" message when clicked', async () => {
    await act(async () => {
      wrapper = mount(<CopyToClipboard value="FizzBuzz" />);

      wrapper
        .find<any>(CTC)
        .props()
        .onCopy();

      // re-render component created via React.memo
      wrapper.setProps({ value: 'FuzzBuzz' });
    });

    expect(wrapper.find(Tooltip).props().content[0].props.children).toEqual(`Copied`);
  });

  it('dismisses "Copied" message when mouse moves over button', async () => {
    await act(async () => {
      wrapper = mount(<CopyToClipboard value="FizzBuzz" />);

      wrapper
        .find<any>(CTC)
        .props()
        .onCopy();

      wrapper
        .find('.co-copy-to-clipboard__btn')
        .first()
        .simulate('mouseenter');
    });

    expect(wrapper.find(Tooltip).props().content[0].props.children).toEqual(`Copy to clipboard`);
  });
});
