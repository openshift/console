import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';
import { Link } from 'react-router-dom';
import {
  ButtonBar,
  history,
  resourceObjPath,
  resourcePathFromModel,
  Firehose,
} from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  apiVersionForModel,
  k8sCreate,
  K8sResourceKind,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { ActionGroup, Button } from '@patternfly/react-core';
import { getName, ResourceDropdown, isObjectSC } from '@console/shared';
import { NooBaaObjectBucketClaimModel, NooBaaBucketClassModel } from '../../models';
import { commonReducer, defaultState, State, Action } from '../object-bucket-page/state';
import { OCS_NS, NB_PROVISIONER } from '../../constants';
import './create-obc.scss';

type CreateOBCFormProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  namespace?: string;
};

export const CreateOBCForm: React.FC<CreateOBCFormProps> = (props) => {
  const { t } = useTranslation();
  const { state, dispatch, namespace } = props;
  const isNoobaa = state.scProvisioner?.includes(NB_PROVISIONER);

  const onScChange = (sc) => {
    dispatch({ type: 'setStorage', name: getName(sc) });
    dispatch({ type: 'setProvisioner', name: sc?.provisioner });
  };

  React.useEffect(() => {
    const obj: K8sResourceKind = {
      apiVersion: apiVersionForModel(NooBaaObjectBucketClaimModel),
      kind: NooBaaObjectBucketClaimModel.kind,
      metadata: {
        namespace,
      },
      spec: {
        ssl: false,
      },
    };
    if (state.scName) {
      obj.spec.storageClassName = state.scName;
    }
    if (state.name) {
      obj.metadata.name = state.name;
      obj.spec.generateBucketName = state.name;
    } else {
      obj.metadata.generateName = 'bucketclaim-';
      obj.spec.generateBucketName = 'bucket-';
    }
    if (state.bucketClass && isNoobaa) {
      obj.spec.additionalConfig = { bucketclass: state.bucketClass };
    }
    dispatch({ type: 'setPayload', payload: obj });
  }, [namespace, state.name, state.scName, state.bucketClass, isNoobaa, dispatch]);

  return (
    <div>
      <div className="form-group">
        <label className="control-label" htmlFor="obc-name">
          {t('ceph-storage-plugin~ObjectBucketClaim Name')}
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={(e) => dispatch({ type: 'setName', name: e.currentTarget.value.trim() })}
            value={state.name}
            placeholder={t('ceph-storage-plugin~my-object-bucket')}
            aria-describedby="obc-name-help"
            id="obc-name"
            data-test="obc-name"
            name="obcName"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
          />
          <p className="help-block" id="obc-name-help">
            {t('ceph-storage-plugin~If not provided a generic name will be generated.')}
          </p>
        </div>
        <div className="form-group">
          <StorageClassDropdown
            onChange={onScChange}
            required
            name="storageClass"
            hideClassName="co-required"
            filter={isObjectSC}
            id="sc-dropdown"
            data-test="sc-dropdown"
          />
          <p className="help-block">
            {t('ceph-storage-plugin~Defines the object-store service and the bucket provisioner.')}
          </p>
        </div>
        {isNoobaa && (
          <div className="form-group">
            <label className="control-label co-required" htmlFor="obc-name">
              {t('ceph-storage-plugin~BucketClass')}
            </label>
            <Firehose
              resources={[
                {
                  isList: true,
                  kind: referenceForModel(NooBaaBucketClassModel),
                  namespace: OCS_NS,
                  prop: 'bucketClass',
                },
              ]}
            >
              <ResourceDropdown
                onChange={(sc) => dispatch({ type: 'setBucketClass', name: sc })}
                dataSelector={['metadata', 'name']}
                selectedKey={state.bucketClass}
                placeholder={t('ceph-storage-plugin~Select BucketClass')}
                dropDownClassName="dropdown--full-width"
                className="nb-create-obc__bc-dropdown"
                id="bc-dropdown"
                data-test="bc-dropdown"
              />
            </Firehose>
          </div>
        )}
      </div>
    </div>
  );
};

export const CreateOBCPage: React.FC<CreateOBCPageProps> = (props) => {
  const { t } = useTranslation();
  const [state, dispatch] = React.useReducer(commonReducer, defaultState);
  const namespace = props.match.params.ns;

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    dispatch({ type: 'setProgress' });
    k8sCreate(NooBaaObjectBucketClaimModel, state.payload)
      .then((resource) => {
        dispatch({ type: 'unsetProgress' });
        history.push(resourceObjPath(resource, referenceFor(resource)));
      })
      .catch((err) => {
        dispatch({ type: 'setError', message: err.message });
        dispatch({ type: 'unsetProgress' });
      });
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{t('ceph-storage-plugin~Create ObjectBucketClaim')}</title>
      </Helmet>
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{t('ceph-storage-plugin~Create ObjectBucketClaim')}</div>
        <div className="co-m-pane__heading-link">
          <Link
            to={`${resourcePathFromModel(NooBaaObjectBucketClaimModel, null, namespace)}/~new`}
            replace
          >
            {t('ceph-storage-plugin~Edit YAML')}
          </Link>
        </div>
      </h1>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <CreateOBCForm state={state} dispatch={dispatch} namespace={namespace} />
        <ButtonBar errorMessage={state.error} inProgress={state.progress}>
          <ActionGroup className="pf-c-form">
            <Button type="submit" variant="primary">
              {t('ceph-storage-plugin~Create')}
            </Button>
            <Button onClick={history.goBack} type="button" variant="secondary">
              {t('ceph-storage-plugin~Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

type CreateOBCPageProps = {
  match: match<{ ns?: string }>;
};
