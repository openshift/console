import { shallow } from 'enzyme';
import { useCloudShellAvailable } from '@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable';
import MarkdownExecuteSnippet, { ExecuteSnippet } from '../MarkdownExecuteSnippet';
import { htmlDocumentForExecuteButton } from './test-data';

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable', () => ({
  useCloudShellAvailable: jest.fn(),
}));

const mockUseCloudShellAvailable = useCloudShellAvailable as jest.Mock;

describe('MarkdownExecuteSnippet', () => {
  beforeAll(() => {
    document.body.innerHTML = htmlDocumentForExecuteButton;
  });
  it('should render null if no element is found', () => {
    mockUseCloudShellAvailable.mockReturnValue(true);
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-3" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(wrapper.find(ExecuteSnippet).exists()).toBe(false);
  });

  it('should render components if element is found and cloudshell available', () => {
    mockUseCloudShellAvailable.mockReturnValue(true);
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );
    expect(wrapper.isEmptyRender()).toBe(false);
    expect(wrapper.find(ExecuteSnippet).exists()).toBe(true);
  });

  it('should render null if element is found and cloudshell is not available', () => {
    mockUseCloudShellAvailable.mockReturnValue(false);
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(wrapper.find(ExecuteSnippet).exists()).toBe(false);
  });
});
