import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Title, pluralize } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { getName } from '@console/dynamic-plugin-sdk';
import {
  convertTime,
  getTimeUnitString,
} from '@console/ceph-storage-plugin/src/utils/bucket-class';
import { State } from '../state';
import { StoreCard } from '../review-utils';
import {
  ReviewListBody,
  ReviewListTitle,
} from '../../ocs-install/install-wizard/review-and-create';
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
    hubNamespaceStore,
    cacheBackingStore,
    timeToLive,
    timeUnit,
    writeNamespaceStore,
  } = state;
  const { error, isLoading } = state;
  const { t } = useTranslation();

  const getReviewForNamespaceStore = () => (
    <>
      <ReviewListBody hideIcon>
        <span>{t('ceph-storage-plugin~Namespace Policy: ')}</span>&nbsp;
        <span className="text-secondary">{namespacePolicyType}</span>
      </ReviewListBody>
      {namespacePolicyType === NamespacePolicyType.SINGLE && (
        <ReviewListBody hideIcon>
          <span>{t('ceph-storage-plugin~Read and write NamespaceStore : ')}</span>&nbsp;
          <span className="text-secondary">{readNamespaceStore[0]?.metadata.name}</span>
        </ReviewListBody>
      )}
      {namespacePolicyType === NamespacePolicyType.CACHE && (
        <>
          <ReviewListBody hideIcon>
            <span>{t('ceph-storage-plugin~Hub namespace store: ')}</span>&nbsp;
            <span className="text-secondary">{getName(hubNamespaceStore)}</span>
          </ReviewListBody>
          <ReviewListBody hideIcon>
            <span>{t('ceph-storage-plugin~Cache backing store: ')}</span>&nbsp;
            <span className="text-secondary">{getName(cacheBackingStore)}</span>
          </ReviewListBody>
          <ReviewListBody hideIcon>
            <span>{t('ceph-storage-plugin~Time to live: ')}</span>&nbsp;
            <span className="text-secondary">{`${pluralize(
              convertTime(timeUnit, timeToLive),
              getTimeUnitString(timeUnit, t),
            )}`}</span>
          </ReviewListBody>
        </>
      )}
      {namespacePolicyType === NamespacePolicyType.MULTI && (
        <ReviewListBody hideIcon>
          <span>{t('ceph-storage-plugin~Resources ')}</span>&nbsp;
          <p>{t('ceph-storage-plugin~Selected read namespace stores: ')}</p>
          <StoreCard resources={readNamespaceStore} />
          <br />
          <span>{t('ceph-storage-plugin~Selected write namespace store: ')}</span>
          <span className="text-secondary">{getName(writeNamespaceStore[0])}</span>
        </ReviewListBody>
      )}
    </>
  );

  const getReviewForBackingStore = () => (
    <>
      <ReviewListBody hideIcon>
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
      <ReviewListBody hideIcon>
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
          <ReviewListBody hideIcon>
            <span>{t('ceph-storage-plugin~BucketClass type: ')}</span>&nbsp;
            <span className="text-secondary">{bucketClassType}</span>
          </ReviewListBody>
          <ReviewListBody hideIcon>
            <span>{t('ceph-storage-plugin~BucketClass name: ')}</span>&nbsp;
            <span data-test="bc-name" className="text-secondary">
              {bucketClassName}
            </span>
          </ReviewListBody>
          {!!description && (
            <ReviewListBody hideIcon>
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
