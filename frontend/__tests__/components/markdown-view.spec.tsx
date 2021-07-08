import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { SyncMarkdownView } from '../../public/components/markdown-view';

jest.mock('showdown', () => ({
  Converter: class {
    makeHtml = (markdown) => markdown;
    addExtension = (extension) => extension;
  },
}));

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('markdown-view', () => {
  it('should render markdown view inline and iframe', () => {
    expect(
      mount(<SyncMarkdownView />)
        .find('iframe')
        .exists(),
    ).toBe(true);
    expect(
      mount(<SyncMarkdownView inline />)
        .find('iframe')
        .exists(),
    ).toBe(false);
  });

  it('should call renderExtension', () => {
    const renderExtension = jest.fn();
    mount(<SyncMarkdownView renderExtension={renderExtension} />);
    expect(renderExtension).not.toHaveBeenCalled();

    mount(<SyncMarkdownView inline renderExtension={renderExtension} />);
    expect(renderExtension).not.toHaveBeenCalled();

    // only call renderExtension when extensions are required
    const v1 = mount(
      <SyncMarkdownView extensions={[{ type: '' }]} renderExtension={renderExtension} />,
    );

    act(() => {
      // force call to iframe onLoad
      v1.find('iframe')
        .props()
        .onLoad({} as React.SyntheticEvent);
    });
    expect(renderExtension).toHaveBeenCalledWith(
      (v1.find('iframe').getDOMNode() as HTMLIFrameElement).contentDocument ?? document,
      '',
    );

    // when inline, call renderExtension with the view ID as the root selector
    renderExtension.mockReset();
    const view = mount(
      <SyncMarkdownView inline extensions={[{ type: '' }]} renderExtension={renderExtension} />,
    );
    expect(renderExtension).toHaveBeenCalledWith(
      document,
      `#${view
        .first()
        .getDOMNode()
        .getAttribute('id')}`,
    );
  });
});
