import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageHeading } from '@console/internal/components/utils';
import { getGuidedToursWithStatus } from './utils/guided-tour-utils';
import GuidedTourCatalog from './GuidedTourCatalog';

const GuidedTours: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Guided Tours</title>
      </Helmet>
      <div className="odc-empty-state__title">
        <PageHeading title="Guided Tours" />
      </div>
      <GuidedTourCatalog tours={getGuidedToursWithStatus()} />
    </>
  );
};

export default GuidedTours;
