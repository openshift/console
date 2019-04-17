/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import Spy = jasmine.Spy;
import * as fileSaver from 'file-saver';

import { DownloadButton, DownloadButtonProps } from '../../../public/components/utils/download-button';
import * as coFetch from '../../../public/co-fetch';

describe(DownloadButton.displayName, () => {
  let wrapper: ShallowWrapper<DownloadButtonProps>;
  const url = 'http://google.com';

  const spyAndExpect = (spy: Spy) => (returnValue: any) => new Promise(resolve => spy.and.callFake((...args) => {
    resolve(args);
    return returnValue;
  }));

  beforeEach(() => {
    wrapper = shallow(<DownloadButton url={url} />);

    spyOn(fileSaver, 'saveAs').and.returnValue(null);
  });

  it('renders button which calls `coFetch` to download URL when clicked', (done) => {
    spyAndExpect(spyOn(coFetch, 'coFetch'))(Promise.resolve()).then(([downloadURL]) => {
      expect(downloadURL).toEqual(url);
      done();
    });

    wrapper.find('button').simulate('click');
  });

  it('renders "Downloading..." if download is in flight', (done) => {
    spyAndExpect(spyOn(coFetch, 'coFetch'))(Promise.resolve()).then(() => {
      expect(wrapper.find('button').text().trim()).toEqual('Downloading...');
      done();
    });

    wrapper.find('button').simulate('click');
  });
});

