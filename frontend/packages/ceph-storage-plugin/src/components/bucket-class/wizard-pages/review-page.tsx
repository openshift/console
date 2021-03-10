import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Title, List, ListItem } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { getName } from '@console/shared';
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
  const { t } = useTranslation();

  return (
    <div className="nb-create-bc-step-page">
      <Title size="xl" headingLevel="h2">
        {t('ceph-storage-plugin~Review and confirm Bucket Class settings')}
      </Title>
      <div className="nb-create-bc-step-page-review__item">
        <Title size="lg" headingLevel="h4" className="nb-create-bc-step-page-review__item-header">
          {t('ceph-storage-plugin~Bucket Class name')}
        </Title>
        <p data-test="bc-name" data-testid="bc-name">
          {bucketClassName}
        </p>
      </div>
      {description && (
        <div className="nb-create-bc-step-page-review__item">
          <Title size="lg" headingLevel="h4" className="nb-create-bc-step-page-review__item-header">
            {t('ceph-storage-plugin~Description')}
          </Title>
          <p data-test="bc-desc" data-testid="bc-desc">
            {description}
          </p>
        </div>
      )}
      <div className="nb-create-bc-step-page-review__item">
        <Title size="lg" headingLevel="h4" className="nb-create-bc-step-page-review__item-header">
          {t('ceph-storage-plugin~Placement Policy Details')}
        </Title>
        <div className="co-nobaa-create-bc-step-page-review__item-tier1">
          <Title size="md" headingLevel="h5" data-test="tier1" data-testid="tier1-policy">
            {t('ceph-storage-plugin~Tier 1: {{tier1Policy}}', { tier1Policy })}
          </Title>
          <div className="nb-bc-create-review__selected-stores" data-testid="tier1-stores">
            <p data-testid="tier1-stores">{t('ceph-storage-plugin~Selected Backing Store:')} </p>
            <List>
              {tier1BackingStore.map((item) => (
                <ListItem>{getName(item)}</ListItem>
              ))}
            </List>
          </div>
        </div>
        {tier2Policy && (
          <>
            <Title size="md" headingLevel="h5" data-test="tier2" data-testid="tier2-policy">
              {t('ceph-storage-plugin~Tier 2:')} {tier2Policy}
            </Title>
            <div className="nb-bc-create-review__selected-stores" data-testid="tier2-stores">
              <p data-testid="tier2-stores">{t('ceph-storage-plugin~Selected Backing Store:')} </p>
              <List>
                {tier2BackingStore.map((item) => (
                  <ListItem>{getName(item)}</ListItem>
                ))}
              </List>
            </div>
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
