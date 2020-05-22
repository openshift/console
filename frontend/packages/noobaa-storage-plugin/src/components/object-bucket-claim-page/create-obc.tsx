import * as _ from 'lodash';
import * as React from 'react';
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
import {
  NooBaaObjectBucketClaimModel,
  NooBaaBucketClassModel,
} from '@console/noobaa-storage-plugin/src/models';
import { ActionGroup, Button } from '@patternfly/react-core';
import { getName, ResourceDropdown, isObjectSC } from '@console/shared';
import { commonReducer, defaultState } from '../object-bucket-page/state';
import { OCS_NS, NB_PROVISIONER } from '../../constants';
import './create-obc.scss';

export const CreateOBCPage: React.FC<CreateOBCPageProps> = (props) => {
  const [state, dispatch] = React.useReducer(commonReducer, defaultState);

  const namespace = _.get(props, 'match.params.ns');

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
    if (state.bucketClass) {
      obj.spec.additionalConfig = { bucketclass: state.bucketClass };
    }
    dispatch({ type: 'setPayload', payload: obj });
  }, [namespace, state.name, state.scName, state.bucketClass]);

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

  const onScChange = (sc) => {
    dispatch({ type: 'setStorage', name: getName(sc) });
    dispatch({ type: 'setProvisioner', name: sc?.provisioner });
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>Create Object Bucket Claim</title>
      </Helmet>
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">Create Object Bucket Claim</div>
        <div className="co-m-pane__heading-link">
          <Link
            to={`${resourcePathFromModel(NooBaaObjectBucketClaimModel, null, namespace)}/~new`}
            replace
          >
            Edit YAML
          </Link>
        </div>
      </h1>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <div>
          <div className="form-group">
            <label className="control-label" htmlFor="obc-name">
              Object Bucket Claim Name
            </label>
            <div className="form-group">
              <input
                className="pf-c-form-control"
                type="text"
                onChange={(e) => dispatch({ type: 'setName', name: e.currentTarget.value })}
                placeholder="my-object-bucket"
                aria-describedby="obc-name-help"
                id="obc-name"
                name="obcName"
                pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
              />
              <p className="help-block" id="obc-name-help">
                If not provided, a generic name will be generated.
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
              />
              <p className="help-block">
                Defines the object-store service and the bucket provisioner.
              </p>
            </div>
            {state.scProvisioner.includes(NB_PROVISIONER) && !_.isEmpty(state.scProvisioner) && (
              <div className="form-group">
                <label className="control-label co-required" htmlFor="obc-name">
                  Bucket Class
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
                    placeholder="Select Bucket Class"
                    dropDownClassName="dropdown--full-width"
                    className="nb-create-obc__bc-dropdown"
                    id="bc-dropdown"
                  />
                </Firehose>
              </div>
            )}
          </div>
        </div>
        <ButtonBar errorMessage={state.error} inProgress={state.progress}>
          <ActionGroup className="pf-c-form">
            <Button type="submit" variant="primary">
              Create
            </Button>
            <Button onClick={history.goBack} type="button" variant="secondary">
              Cancel
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
