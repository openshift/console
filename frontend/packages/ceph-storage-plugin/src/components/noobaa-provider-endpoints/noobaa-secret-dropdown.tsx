import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { ProjectModel, SecretModel } from '@console/internal/models';
import { ResourceDropdown, getName, getNamespace } from '@console/shared';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { ProviderDataState, StoreAction } from '../namespace-store/reducer';
import { CEPH_STORAGE_NAMESPACE, EXCLUDED_PREFIX, EXCLUDED_NS } from '../../constants';
import './noobaa-provider-endpoints.scss';

const projectResource = {
  isList: true,
  kind: ProjectModel.kind,
};

const getSecretResource = (namespace: string) => ({
  isList: true,
  namespace,
  kind: SecretModel.kind,
});

const getFirehoseResult = (data: K8sResourceCommon, loaded: boolean, loadError: any) => ({
  loaded,
  loadError,
  data,
  kind: SecretModel.kind,
});

const isValidNS = (projName: string) => {
  const isValid = EXCLUDED_PREFIX.reduce((acc, cur) => {
    return acc && !projName.startsWith(cur);
  }, true);
  return isValid && !EXCLUDED_NS.includes(projName);
};

const transformLabel = (resource: K8sResourceCommon) => (
  <span className="co-resource-item">
    <span className="co-resource-item__resource-name">
      <span>{getName(resource)}</span>
      {getNamespace(resource) && (
        <div className="text-muted co-truncate co-nowrap small co-resource-item__resource-namespace">
          {getNamespace(resource)}
        </div>
      )}
    </span>
  </span>
);

const getTransformLabelName = (item: object) =>
  _.get(_.get(item, ['props', 'children', 'props', 'children'])[0], ['props', 'children']);

const autocompleteFilter = (strText: string, item: object) =>
  getTransformLabelName(item).includes(strText);

export const DefaultSecretDropdown: React.FC<SecretDropdownProps> = ({
  state,
  dispatch,
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <Firehose resources={[getSecretResource(namespace)]}>
      <ResourceDropdown
        id="secret-dropdown"
        selectedKey={state.secretName}
        placeholder={t('ceph-storage-plugin~Select Secret')}
        className="nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width"
        buttonClassName="nb-endpoints-form-entry__dropdown"
        dataSelector={['metadata', 'name']}
        onChange={(e) => dispatch({ type: 'setSecretName', value: e })}
      />
    </Firehose>
  );
};

export const OSDSecretDropdown: React.FC<SecretDropdownProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();

  const [projData, projDataLoaded, projDataError] = useK8sWatchResource<K8sResourceCommon[]>(
    projectResource,
  );

  const secretResources = React.useMemo(() => {
    const res = {};
    if (projDataLoaded && !projDataError) {
      res[CEPH_STORAGE_NAMESPACE] = getSecretResource(CEPH_STORAGE_NAMESPACE);
      projData.forEach((project) => {
        const name = getName(project);
        if (isValidNS(name)) res[name] = getSecretResource(name);
      });
    }
    return res;
  }, [projData, projDataLoaded, projDataError]);

  const secretResourcesData: ResourcesObject = useK8sWatchResources(secretResources);

  const [secretData, secretLoaded, secretError] = React.useMemo(() => {
    let loaded = false;
    let itrCount = 0;
    let firstItr = true;
    let loadError: any;
    let allError: any;
    const data: FirehoseResult[] = _.reduce(
      secretResourcesData,
      (acc, curr) => {
        /**
         * If user is not authorised, loadError === 401 || 403
         * We can skip that resource and show only the ones user has access to.
         * If can't access any resource, return the error.
         */
        if (!_.includes([401, 403], curr.loadError?.code)) {
          if (firstItr) {
            loaded = curr.loaded;
            firstItr = false;
          } else loaded = loaded && curr.loaded;
          loadError = loadError || curr.loadError;
          acc.push(getFirehoseResult(curr.data, curr.loaded, curr.loadError));
        } else {
          allError = allError || curr.loadError;
          itrCount++;
        }
        return acc;
      },
      [],
    );

    if (!!allError && itrCount === _.size(secretResourcesData)) return [data, true, allError];

    return [data, loaded, loadError];
  }, [secretResourcesData]);

  return (
    <ResourceDropdown
      id="secret-dropdown"
      selectedKey={state.secretName}
      placeholder={t('ceph-storage-plugin~Select Secret')}
      loaded={secretLoaded}
      loadError={secretError}
      resources={secretData}
      className="nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width"
      buttonClassName="nb-endpoints-form-entry__dropdown"
      dataSelector={['metadata', 'name']}
      onChange={(key, obj, resource) => {
        dispatch({ type: 'setSecretName', value: key });
        dispatch({ type: 'setSecretNamespace', value: getNamespace(resource) });
      }}
      autocompleteFilter={autocompleteFilter}
      transformLabel={transformLabel}
    />
  );
};

export type SecretDropdownProps = {
  state: ProviderDataState;
  dispatch: React.Dispatch<StoreAction>;
  namespace: string;
};

type ResourcesObject = {
  [key: string]: {
    data: K8sResourceCommon;
    loaded: boolean;
    loadError: any;
  };
};
