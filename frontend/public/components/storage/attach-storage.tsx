import * as React from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useParams } from 'react-router-dom-v5-compat';
import { Radio } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { useExtensions } from '@console/plugin-sdk';
import { isStorageProvider, StorageProvider } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/shared';
import { ErrorBoundaryPage } from '@console/shared/src/components/error';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { K8sKind } from '../../module/k8s';
import { AsyncComponent, ResourceLink, LoadingBox } from '../utils';
import { connectToPlural } from '../../kinds';

export type AttachStorageFormProps = {
  kindObj: K8sKind;
  kindsInFlight: any;
  history: History;
};

type StorageProviderMap = {
  [key: string]: {
    name: string;
    Component: () => Promise<any>;
  };
};

const AttachStorageInner: React.FC<AttachStorageFormProps> = (props) => {
  const storageProviders = useExtensions<StorageProvider>(isStorageProvider);
  const [activeProvider, setActiveProvider] = React.useState('0');
  const memoizedStorageProviders = useDeepCompareMemoize(storageProviders, true);
  const { kindObj, kindsInFlight } = props;
  const params = useParams();

  const { t } = useTranslation();

  const storageProvidersMap: StorageProviderMap = React.useMemo(() => {
    const providers = {
      '0': {
        name: t('public~PersistentVolumeClaim'),
        Component: () => import('./attach-pvc-storage').then((m) => m.AttachStorage),
      },
    };
    memoizedStorageProviders.forEach((item, i) => {
      providers[`${i + 1}`] = {
        name: item.properties.name,
        Component: item.properties.Component,
      };
    });
    return providers;
  }, [memoizedStorageProviders, t]);

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    const id = e?.currentTarget?.id;
    setActiveProvider(id as string);
  };

  return !kindObj && kindsInFlight ? (
    <LoadingBox />
  ) : (
    <>
      <DocumentTitle>{t('public~Add Storage')}</DocumentTitle>
      <PageHeading
        title={
          <>
            {t('public~Add Storage')}
            <Trans t={t} ns="public">
              {' '}
              to{' '}
              <ResourceLink
                inline
                kind={props?.kindObj?.kind}
                name={params.name}
                namespace={params.ns}
              />
            </Trans>
          </>
        }
        helpText={
          <>
            {Object.keys(storageProvidersMap).length > 1 && (
              <>
                <label className="co-required">{t('public~Storage type')}</label>
                {Object.entries(storageProvidersMap).map(([k, v]) => (
                  <Radio
                    key={k}
                    isChecked={activeProvider === k}
                    onChange={handleChange}
                    label={v.name}
                    id={k}
                    value={v.name}
                    name={v.name}
                  />
                ))}
              </>
            )}
          </>
        }
      />
      <PaneBody>
        <ErrorBoundaryPage>
          <AsyncComponent loader={storageProvidersMap[activeProvider].Component} {...props} />
        </ErrorBoundaryPage>
      </PaneBody>
    </>
  );
};

const AttachStorage_ = connectToPlural(AttachStorageInner);

export const AttachStorage = (props) => {
  const params = useParams();
  return <AttachStorage_ {...props} params={params} />;
};

export default AttachStorage;
