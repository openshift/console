import * as React from 'react';
import Helmet from 'react-helmet';
import { match as Match } from 'react-router';
import { Radio } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { useExtensions } from '@console/plugin-sdk';
import { isStorageProvider, StorageProvider } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/shared';
import { K8sKind } from '../../module/k8s';
import { AsyncComponent, ResourceLink, LoadingBox } from '../utils';
import { connectToPlural } from '../../kinds';
import './attach-storage.scss';

export type AttachStorageFormProps = {
  kindObj: K8sKind;
  match?: Match<{ ns: string; name: string }>;
  kindsInFlight: any;
  history: History;
};

type StorageProviderMap = {
  [key: string]: {
    name: string;
    Component: () => Promise<any>;
  };
};

const AttachStorage: React.FC<AttachStorageFormProps> = (props) => {
  const storageProviders = useExtensions<StorageProvider>(isStorageProvider);
  const [activeProvider, setActiveProvider] = React.useState('0');
  const memoizedStorageProviders = useDeepCompareMemoize(storageProviders, true);
  const { kindObj, match, kindsInFlight } = props;

  const { t } = useTranslation();

  const storageProvidersMap: StorageProviderMap = React.useMemo(() => {
    const providers = {
      '0': {
        name: 'PersistentVolumeClaim',
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
  }, [memoizedStorageProviders]);

  const handleChange = (_checked: boolean, e: React.FormEvent<HTMLInputElement>) => {
    const id = e?.currentTarget?.id;
    setActiveProvider(id as string);
  };

  return !kindObj && kindsInFlight ? (
    <LoadingBox />
  ) : (
    <div className="co-m-pane__body">
      <Helmet>
        <title>{t('public~Add Storage')}</title>
      </Helmet>
      <div className="co-storage-heading__wrapper">
        <Trans t={t} ns="public">
          <h1 className="co-m-pane__heading">Add Storage</h1>
          <div className="co-m-pane__explanation co-storage-heading__subtitle">
            {' '}
            to{' '}
            <ResourceLink
              inline
              kind={props?.kindObj?.kind}
              name={match.params.name}
              namespace={match.params.ns}
            />
          </div>
        </Trans>
      </div>
      {Object.keys(storageProvidersMap).length > 1 && (
        <>
          <label className="co-required">{t('public~Storage type')}</label>
          <div className="co-storage__selection">
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
          </div>
        </>
      )}
      <AsyncComponent loader={storageProvidersMap[activeProvider].Component} {...props} />
    </div>
  );
};

export default connectToPlural(AttachStorage);
