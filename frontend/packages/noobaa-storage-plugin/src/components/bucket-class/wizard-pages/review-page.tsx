import * as React from 'react';
import { Alert, Title } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { State } from '../state';

const ReviewPage: React.FC<ReviewPageProps> = ({ state }) => {
  const {
    bucketClassName,
    description,
    tier1BackingStore,
    tier2BackingStore,
    tier1Policy,
    tier2Policy,
  } = state;
  const { error, isLoading } = state;
  return (
    <div className="nb-create-bc-step-page">
      <Title size="xl" headingLevel="h2">
        Review and confirm Bucket Class settings
      </Title>
      <div className="nb-create-bc-step-page-review__item">
        <Title size="lg" headingLevel="h4" className="nb-create-bc-step-page-review__item-header">
          Bucket Class name
        </Title>
        <p>{bucketClassName}</p>
      </div>
      {description && (
        <div className="nb-create-bc-step-page-review__item">
          <Title size="lg" headingLevel="h4" className="nb-create-bc-step-page-review__item-header">
            Description
          </Title>
          <p>{description}</p>
        </div>
      )}
      <div className="nb-create-bc-step-page-review__item">
        <Title size="lg" headingLevel="h4" className="nb-create-bc-step-page-review__item-header">
          Placement Policy Details
        </Title>
        <div className="co-nobaa-create-bc-step-page-review__item-tier1">
          <Title size="md" headingLevel="h5">
            Tier 1: {tier1Policy}
          </Title>
          <p>Selected Backing Store: {tier1BackingStore.join(', ')}</p>
        </div>
        {tier2Policy && (
          <>
            <Title size="md" headingLevel="h5">
              Tier 2: {tier2Policy}
            </Title>
            <p>Selected Backing Store: {tier2BackingStore.join(', ')}</p>
          </>
        )}
      </div>
      {isLoading && <LoadingInline />}
      {!!error && (
        <Alert variant="danger" title="Error" isInline>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default ReviewPage;

type ReviewPageProps = {
  state: State;
};
