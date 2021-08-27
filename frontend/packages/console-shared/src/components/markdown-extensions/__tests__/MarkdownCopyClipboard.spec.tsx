import * as React from 'react';
import { shallow } from 'enzyme';
import MarkdownCopyClipboard, { CopyClipboard } from '../MarkdownCopyClipboard';
import { htmlDocumentForCopyClipboard } from './test-data';

describe('MarkdownCopyClipboard', () => {
  beforeAll(() => {
    document.body.innerHTML = htmlDocumentForCopyClipboard;
  });
  it('should render null if no element is found', () => {
    const wrapper = shallow(
      <MarkdownCopyClipboard docContext={document} rootSelector="#copy-markdown-3" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(wrapper.find(CopyClipboard).exists()).toBe(false);
  });

  it('should render null if no element is found', () => {
    const wrapper = shallow(
      <MarkdownCopyClipboard docContext={document} rootSelector="#copy-markdown-1" />,
    );
    expect(wrapper.isEmptyRender()).toBe(false);
    expect(wrapper.find(CopyClipboard).exists()).toBe(true);
  });
});
