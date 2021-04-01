import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Title } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { State } from '../state';
import { ReviewListTitle, ReviewListBody, StoreCard } from '../review-utils';
import { NamespacePolicyType, BucketClassType } from '../../../constants/bucket-class';

const ReviewPage: React.FC<ReviewPageProps> = ({ state }) => {
  const {
    bucketClassName,
    description,
    tier1BackingStore,
    tier2BackingStore,
    tier1Policy,
    tier2Policy,
    namespacePolicyType,
    bucketClassType,
    readNamespaceStore,
  } = state;
  const { error, isLoading } = state;
  const { t } = useTranslation();

  const getReviewForNamespaceStore = () => (
    <>
      <ReviewListBody>
        <span>{t('ceph-storage-plugin~Namespace Policy: ')}</span>&nbsp;
        <span className="text-secondary">{namespacePolicyType}</span>
      </ReviewListBody>
      {namespacePolicyType === NamespacePolicyType.SINGLE && (
        <ReviewListBody>
          <span>{t('ceph-storage-plugin~Read and write NamespaceStore : ')}</span>&nbsp;
          <span className="text-secondary">{readNamespaceStore[0]?.metadata.name}</span>
        </ReviewListBody>
      )}
    </>
  );

  const getReviewForBackingStore = () => (
    <>
      <ReviewListBody>
        <span>{t('ceph-storage-plugin~Placement policy details ')}</span>&nbsp;
        <br />
        <p data-test="tier1">
          <b>
            {t('ceph-storage-plugin~Tier 1: ')}
            {tier1Policy}
          </b>
        </p>
        <p>{t('ceph-storage-plugin~Selected BackingStores')}</p>
        <StoreCard resources={tier1BackingStore} />
      </ReviewListBody>
      <ReviewListBody>
        {!!tier2Policy && (
          <>
            <p data-test="tier2">
              <b>
                {t('ceph-storage-plugin~Tier 2: ')}
                {tier2Policy}
              </b>
            </p>
            <p>{t('ceph-storage-plugin~Selected BackingStores')}</p>
            <StoreCard resources={tier2BackingStore} />
          </>
        )}
      </ReviewListBody>
    </>
  );

  return (
    <div className="nb-create-bc-step-page">
      <Title size="xl" headingLevel="h2">
        {t('ceph-storage-plugin~Review BucketClass')}
      </Title>
      <dl>
        <ReviewListTitle text={t('ceph-storage-plugin~General')} />
        <br />
        <div className="nb-create-bc-list--indent">
          <ReviewListBody>
            <span>{t('ceph-storage-plugin~BucketClass type: ')}</span>&nbsp;
            <span className="text-secondary">{bucketClassType}</span>
          </ReviewListBody>
          <ReviewListBody>
            <span>{t('ceph-storage-plugin~BucketClass name: ')}</span>&nbsp;
            <span data-test="bc-name" className="text-secondary">
              {bucketClassName}
            </span>
          </ReviewListBody>
          {!!description && (
            <ReviewListBody>
              <span>{t('ceph-storage-plugin~Description: ')}</span>&nbsp;
              <span data-test="bc-desc" className="text-secondary">
                {description}
              </span>
            </ReviewListBody>
          )}
          {bucketClassType === BucketClassType.NAMESPACE
            ? getReviewForNamespaceStore()
            : getReviewForBackingStore()}
        </div>
      </dl>
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
