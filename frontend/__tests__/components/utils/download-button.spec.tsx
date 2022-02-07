import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import fileSaver from 'file-saver';
import { Button } from '@patternfly/react-core';

import {
  DownloadButton,
  DownloadButtonProps,
} from '../../../public/components/utils/download-button';
import * as coFetch from '../../../public/co-fetch';

describe(DownloadButton.displayName, () => {
  let wrapper: ReactWrapper<DownloadButtonProps>;
  const url = 'http://google.com';

  const spyAndExpect = (spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.mockImplementation((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  beforeEach(() => {
    wrapper = mount(<DownloadButton url={url} />);

    jest.spyOn(fileSaver, 'saveAs').mockReturnValue(null);
  });

  it('renders button which calls `coFetch` to download URL when clicked', (done) => {
    spyAndExpect(jest.spyOn(coFetch, 'coFetch'))(Promise.resolve()).then(([downloadURL]) => {
      expect(downloadURL).toEqual(url);
      done();
    });

    wrapper.find(Button).simulate('click');
  });

  it('renders "Downloading..." if download is in flight', (done) => {
    spyAndExpect(jest.spyOn(coFetch, 'coFetch'))(Promise.resolve()).then(() => {
      expect(
        wrapper
          .find(Button)
          .text()
          .trim(),
      ).toEqual('Downloading...');
      done();
    });

    wrapper.find('button').simulate('click');
  });
});
