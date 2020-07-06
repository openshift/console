import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import { GuidedTourCatalogItem } from './utils/guided-tour-typings';
import GuidedTourItem from './GuidedTourItem';
import './GuidedTourCatalog.scss';

type GuidedTourCatalogProps = {
  tours: GuidedTourCatalogItem[];
};

const GuidedTourCatalog: React.FC<GuidedTourCatalogProps> = ({ tours }) => (
  <div className="oc-guided-tour-catalog">
    {!tours || tours.length === 0 ? (
      <EmptyBox label="Guided Tours" />
    ) : (
      <Gallery hasGutter>
        {tours.map((tour) => (
          <GalleryItem key={tour.name}>
            <GuidedTourItem {...tour} />
          </GalleryItem>
        ))}
      </Gallery>
    )}
  </div>
);

export default GuidedTourCatalog;
