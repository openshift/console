import * as React from 'react';
import { shallow } from 'enzyme';
import { RouteLinkAndCopy } from '@console/internal/components/routes';
import { mockResources } from '../../__mocks__/import-toast-mock';
import ImportToastContent from '../ImportToastContent';

describe('ImportToastContent', () => {
  it('should show route details', () => {
    const importToastWrapper = shallow(<ImportToastContent {...mockResources[0]} />);
    expect(importToastWrapper.find(RouteLinkAndCopy).exists()).toBe(true);
  });

  it('should not show route details', () => {
    const importToastWrapper = shallow(<ImportToastContent {...mockResources[1]} />);
    expect(importToastWrapper.find(RouteLinkAndCopy).exists()).toBe(false);
  });
});
