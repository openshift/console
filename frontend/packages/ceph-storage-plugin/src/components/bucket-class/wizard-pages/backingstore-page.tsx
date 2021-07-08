import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { FirehoseResult, ExternalLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Action, State } from '../state';
import BackingStoreSelection from '../backingstore-table';

const BackingStorePage: React.FC<BackingStorePageProps> = React.memo(
  ({ dispatcher, state, namespace }) => {
    // CR data
    // CR data clones to maintain order and selection state for table rows
    const { tier2Policy, tier1Policy, tier1BackingStore, tier2BackingStore } = state;
    const [showHelp, setShowHelp] = React.useState(true);
    const { t } = useTranslation();

    return (
      <div className="nb-create-bc-step-page">
        {showHelp && (
          <Alert
            className="nb-create-bc-step-page__info"
            isInline
            variant="info"
            title={t('ceph-storage-plugin~What is a BackingStore?')}
            actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
          >
            <p>
              {t(
                'ceph-storage-plugin~BackingStore represents a storage target to be used as the underlying storage for the data in Multicloud Object Gateway buckets.',
              )}
            </p>
            <p>
              {t(
                'ceph-storage-plugin~Multiple types of BackingStores are supported: asws-s3 s3-compatible google-cloud-storage azure-blob obc PVC.',
              )}
            </p>
            <ExternalLink
              href="https://github.com/noobaa/noobaa-operator/blob/master/doc/backing-store-crd.md"
              text={t('ceph-storage-plugin~Learn More')}
            />
          </Alert>
        )}
        <BackingStoreSelection
          namespace={namespace}
          tier1Policy={tier1Policy}
          tier2Policy={tier2Policy}
          selectedTierA={tier1BackingStore}
          selectedTierB={tier2BackingStore}
          setSelectedTierA={(bs) => dispatcher({ type: 'setBackingStoreTier1', value: [...bs] })}
          setSelectedTierB={(bs) => dispatcher({ type: 'setBackingStoreTier2', value: [...bs] })}
        />
      </div>
    );
  },
);

export default BackingStorePage;

type BackingStorePageProps = {
  backingStores?: FirehoseResult<K8sResourceKind[]>;
  dispatcher: React.Dispatch<Action>;
  state: State;
  namespace: string;
};
