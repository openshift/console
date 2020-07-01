import * as React from 'react';
import { shallow } from 'enzyme';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import GuidedTourCatalog from '../GuidedTourCatalog';
import { getGuidedToursWithStatus } from '../utils/guided-tour-utils';

describe('GuidedTourCatalog', () => {
  it('should load an emptybox if no tours exist', () => {
    const guidedTourCatalogProps = { tours: [] };
    const guidedTourCatalogWrapper = shallow(<GuidedTourCatalog {...guidedTourCatalogProps} />);
    expect(guidedTourCatalogWrapper.find(EmptyBox).exists()).toBeTruthy();
  });
  it('should load a gallery if tours exist', () => {
    const guidedTourCatalogProps = { tours: getGuidedToursWithStatus() };
    const guidedTourCatalogWrapper = shallow(<GuidedTourCatalog {...guidedTourCatalogProps} />);
    expect(guidedTourCatalogWrapper.find(Gallery).exists()).toBeTruthy();
  });
  it('should load galleryItems equal to the number of tours', () => {
    const guidedTourCatalogProps = { tours: getGuidedToursWithStatus() };
    const guidedTourCatalogWrapper = shallow(<GuidedTourCatalog {...guidedTourCatalogProps} />);
    const galleryItems = guidedTourCatalogWrapper.find(GalleryItem);
    expect(galleryItems.exists()).toBeTruthy();
    expect(galleryItems.length).toEqual(3);
  });
});
