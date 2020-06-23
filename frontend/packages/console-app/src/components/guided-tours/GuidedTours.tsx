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
      <PageHeading title="Guided Tours" />
      <GuidedTourCatalog tours={getGuidedToursWithStatus()} />
    </>
  );
};

export default GuidedTours;
