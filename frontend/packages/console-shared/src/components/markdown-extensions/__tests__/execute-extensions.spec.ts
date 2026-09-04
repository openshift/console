import { renderHook } from '@testing-library/react';
import { useCloudShellAvailable } from '@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable';
import { useInlineExecuteCommandExtension } from '../inline-execute-extension';
import { useMultilineExecuteCommandExtension } from '../multiline-execute-extension';

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable', () => ({
  useCloudShellAvailable: jest.fn(),
}));

const mockUseCloudShellAvailable = useCloudShellAvailable as jest.Mock;

describe('execute markdown extensions', () => {
  beforeEach(() => {
    mockUseCloudShellAvailable.mockReturnValue(true);
  });

  // Regression test for OCPBUGS-98159: whitespace/newlines between the
  // <pre> and <code> tags render as a visible leading blank line/indentation
  // in the browser since <pre> preserves whitespace literally.
  it('multiline extension renders <pre><code> adjacent with no whitespace between the tags', () => {
    const { result } = renderHook(() => useMultilineExecuteCommandExtension());
    const html = result.current.replace(
      '```\noc get pods\n```{{execute}}',
      'oc get pods\n',
      'oc get pods\n',
      'lang',
      'snippet-1',
    );

    expect(html).toMatch(/<pre[^>]*><code[^>]*>oc get pods<\/code><\/pre>/);

    const container = document.createElement('div');
    container.innerHTML = html;
    const codeEl = container.querySelector('code');
    expect(codeEl.previousSibling).toBeNull();
    expect(codeEl.textContent).toBe('oc get pods');
  });

  it('inline extension renders <pre><code> adjacent with no whitespace between the tags', () => {
    const { result } = renderHook(() => useInlineExecuteCommandExtension());
    const html = result.current.replace(
      '`oc get pods`{{execute}}',
      'oc get pods',
      'oc get pods',
      'lang',
      'snippet-2',
    );

    expect(html).toMatch(/<pre[^>]*><code[^>]*>oc get pods<\/code><\/pre>/);

    const container = document.createElement('div');
    container.innerHTML = html;
    const codeEl = container.querySelector('code');
    expect(codeEl.previousSibling).toBeNull();
    expect(codeEl.textContent).toBe('oc get pods');
  });
});
