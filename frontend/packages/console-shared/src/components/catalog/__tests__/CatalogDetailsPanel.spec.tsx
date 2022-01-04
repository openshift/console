import * as React from 'react';
import { shallow } from 'enzyme';
import CatalogDetailsPanel from '../details/CatalogDetailsPanel';
import { eventSourceCatalogItems } from './catalog-item-data';

describe('Catalog details panel', () => {
  it('should show Support as Community', () => {
    const wrapper = shallow(<CatalogDetailsPanel item={eventSourceCatalogItems[1]} />);
    expect(wrapper.find('PropertyItem[label="Support"]').props().value).toBe('Community');
  });

  it('should show one Support property in properties side panel', () => {
    const wrapper = shallow(<CatalogDetailsPanel item={eventSourceCatalogItems[1]} />);
    expect(wrapper.find('PropertyItem[label="Support"]').length).toBe(1);
  });
});
