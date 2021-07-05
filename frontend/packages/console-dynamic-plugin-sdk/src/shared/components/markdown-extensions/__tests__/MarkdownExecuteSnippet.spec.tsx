import * as React from 'react';
import { shallow } from 'enzyme';
import useCloudShellAvailable from '@console/app/src/components/cloud-shell/useCloudShellAvailable';
import MarkdownExecuteSnippet, { ExecuteSnippet } from '../MarkdownExecuteSnippet';
import { htmlDocumentForExecuteButton } from './test-data';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/app/src/components/cloud-shell/useCloudShellAvailable', () => ({
  default: jest.fn(),
}));

describe('MarkdownExecuteSnippet', () => {
  beforeAll(() => {
    document.body.innerHTML = htmlDocumentForExecuteButton;
  });
  it('should render null if no element is found', () => {
    (useCloudShellAvailable as jest.Mock).mockReturnValueOnce(true);
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-3" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(wrapper.find(ExecuteSnippet).exists()).toBe(false);
  });

  it('should render components if element is found and cloudshell available', () => {
    (useCloudShellAvailable as jest.Mock).mockReturnValueOnce(true);
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );
    expect(wrapper.isEmptyRender()).toBe(false);
    expect(wrapper.find(ExecuteSnippet).exists()).toBe(true);
  });

  it('should render null if element is found and cloudshell is not available', () => {
    (useCloudShellAvailable as jest.Mock).mockReturnValueOnce(false);
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(wrapper.find(ExecuteSnippet).exists()).toBe(false);
  });
});
