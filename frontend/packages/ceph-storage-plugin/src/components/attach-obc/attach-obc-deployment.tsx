import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Match } from 'react-router';
import { History } from 'history';
import {
  ListDropdown,
  resourceObjPath,
  ButtonBar,
  LoadingBox,
} from '@console/internal/components/utils';
import {
  K8sKind,
  referenceForModel,
  k8sCreate,
  k8sPatch,
  DeploymentKind,
  referenceFor,
} from '@console/internal/module/k8s/';
import { Form, FormGroup, Radio, ActionGroup, Button } from '@patternfly/react-core';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { getName } from '@console/dynamic-plugin-sdk';
import { NooBaaObjectBucketClaimModel } from '../../models';
import { CreateOBCForm } from '../object-bucket-claim-page/create-obc';
import { commonReducer, defaultState } from '../object-bucket-page/state';
import { getAttachOBCPatch } from '../../utils';
import './attach-obc-deployment.scss';

const AttachStorage: React.FC<AttachStorageProps> = (props) => {
  const { t } = useTranslation();
  const [state, dispatch] = React.useReducer(commonReducer, defaultState);
  const [createOBC, setCreateOBC] = React.useState(false);
  const [selectedOBC, setSelectedOBC] = React.useState('');
  const { kindObj, namespace, resourceName, history } = props;

  const [deployment, loaded, loadError] = useK8sGet<DeploymentKind>(
    kindObj,
    resourceName,
    namespace,
  );

  const onSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      let obc = selectedOBC;
      if (createOBC) {
        dispatch({ type: 'setProgress' });
        const obj = await k8sCreate(NooBaaObjectBucketClaimModel, state.payload);
        obc = getName(obj);
      }
      const patch = getAttachOBCPatch(obc, deployment);
      const patchedObj = await k8sPatch(kindObj, deployment, patch);
      dispatch({ type: 'unsetProgress' });
      history.push(`${resourceObjPath(patchedObj, referenceFor(patchedObj))}/environment`);
    } catch (err) {
      dispatch({ type: 'unsetProgress' });
      dispatch({ type: 'setError', message: err.message });
    }
  };

  const onRadioToggle = () => setCreateOBC((val) => !val);

  return (
    <Form onSubmit={onSubmit} className="co-m-pane__body-group co-m-pane__form">
      <FormGroup fieldId="exists" label="ObjectBucketClaim" isRequired>
        <Radio
          label={t('ceph-storage-plugin~Use existing claim')}
          value="exists"
          key="exists"
          onChange={onRadioToggle}
          id="exists"
          name="exists"
          isChecked={!createOBC}
        />
        {!createOBC && (
          <div className="ceph-attach-obc__subgroup">
            <ListDropdown
              resources={[{ kind: referenceForModel(NooBaaObjectBucketClaimModel), namespace }]}
              selectedKeyKind={referenceForModel(NooBaaObjectBucketClaimModel)}
              placeholder={t('ceph-storage-plugin~Select claim')}
              selectedKey={selectedOBC}
              onChange={(item) => setSelectedOBC(item)}
            />
          </div>
        )}
      </FormGroup>
      <FormGroup fieldId="create">
        <Radio
          label={t('ceph-storage-plugin~Create new claim')}
          value="create"
          key="create"
          onChange={onRadioToggle}
          id="create"
          name="create"
          isChecked={createOBC}
        />
        {createOBC && (
          <div className="ceph-attach-obc__subgroup">
            <CreateOBCForm state={state} dispatch={dispatch} namespace={namespace} />
          </div>
        )}
      </FormGroup>
      <ButtonBar errorMessage={state.error || loadError?.message} inProgress={state.progress}>
        <ActionGroup className="pf-c-form">
          <Button type="submit" variant="primary" disabled={loadError || !loaded}>
            {t('ceph-storage-plugin~Create')}
          </Button>
          <Button onClick={history.goBack} type="button" variant="secondary">
            {t('ceph-storage-plugin~Cancel')}
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  );
};

const AttachStorageWrapper: React.FC<AttachStorageWrapperProps> = (props) => {
  const {
    kindObj,
    kindsInFlight,
    match: { params },
  } = props;
  return !kindObj && kindsInFlight ? (
    <LoadingBox />
  ) : (
    <AttachStorage namespace={params.ns} resourceName={params.name} {...props} />
  );
};

type AttachStorageWrapperProps = {
  kindObj: K8sKind;
  kindsInFlight: any;
  match?: Match<{ ns: string; name: string }>;
  history: History;
};

type AttachStorageProps = AttachStorageWrapperProps & {
  namespace: string;
  resourceName: string;
};

export default AttachStorageWrapper;
