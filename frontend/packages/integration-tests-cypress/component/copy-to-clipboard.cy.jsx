import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import { CopyToClipboard } from '../../../public/components/utils/copy-to-clipboard';

describe('<CopyToClipboard />', () => {
  it('mounts', () => {
    cy.mount(<CopyToClipboard />);
  });
});
