import * as React from 'react';
import { shallow } from 'enzyme';

import { CommandLineTools } from '../../public/components/command-line-tools';

describe('CommandLineTools', () => {
  let wrapper;
  const obj = {
    data: [
      {
        metadata: {
          name: 'helm-download-links',
          uid: '1',
        },
        spec: {
          displayName: 'helm - Helm 3 CLI',
          links: [],
        },
      },
      {
        metadata: {
          name: 'oc-cli-downloads',
          uid: '2',
        },
        spec: {
          displayName: 'oc - OpenShift Command Line Interface (CLI)',
          links: [],
        },
      },
    ],
    loadError: '',
    loaded: true,
  };

  describe('When ordering is correct', () => {
    beforeEach(() => {
      wrapper = shallow(<CommandLineTools obj={obj} />);
    });

    it('shows oc first', () => {
      expect(
        wrapper
          .find('.co-section-heading')
          .first()
          .text(),
      ).toEqual('oc - OpenShift Command Line Interface (CLI)');
    });
  });
});
