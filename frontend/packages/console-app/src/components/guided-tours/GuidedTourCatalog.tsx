import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import { GuidedTourItem as TourItem, TourStatus } from './utils/guided-tour-typings';
import GuidedTourItem from './GuidedTourItem';
import './GuidedTourCatalog.scss';

type GuidedTourCatalogItem = TourItem & TourStatus;
type GuidedTourCatalogProps = {
  tours: GuidedTourCatalogItem[];
};

const GuidedTourCatalog: React.FC<GuidedTourCatalogProps> = ({ tours }) => (
  <div className="odc-guided-tour-catalog">
    {!tours || tours.length === 0 ? (
      <EmptyBox label="Guided Tours" />
    ) : (
      <Gallery gutter="sm">
        {tours.map((tour) => (
          <GalleryItem>
            <GuidedTourItem key={`tour-${tour.name}`} {...tour} />
          </GalleryItem>
        ))}
      </Gallery>
    )}
  </div>
);

export default GuidedTourCatalog;
