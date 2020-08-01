import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import {
  Dropdown,
  FirehoseResult,
  Firehose,
  HandlePromiseProps,
  history,
  resourceObjPath,
  withHandlePromise,
} from '@console/internal/components/utils';
import { DeploymentModel } from '@console/internal/models';
import {
  ContainerSpec,
  K8sKind,
  k8sPatch,
  K8sResourceKind,
  referenceFor,
} from '@console/internal/module/k8s/';
import { getName } from '@console/shared';

const AttachDeploymentToOBCModal = withHandlePromise((props: AttachDeploymentToOBCModalProps) => {
  const [requestDeployment, setRequestedDeployment] = React.useState({});
  const [deploymentObjects, setDeployments] = React.useState({});
  const [deploymentNames, setDeploymentNames] = React.useState({});
  const { handlePromise, close, cancel, resource, deployments } = props;

  const obcName = getName(resource);
  const deploymentData = _.get(deployments, 'data');
  const inProgress = _.get(props, 'loaded');
  const errorMessage = _.get(props, 'loadError');

  React.useEffect(() => {
    const deploymentObjectList = {};
    const deploymentNameList = {};

    _.map(deploymentData, (data) => {
      const name = getName(data);
      deploymentObjectList[name] = data;
      deploymentNameList[name] = name;
    });

    setDeployments(deploymentObjectList);
    setDeploymentNames(deploymentNameList);
  }, [deploymentData, deployments]);

  const getPatches = () => {
    const configMapRef = {
      configMapRef: {
        name: obcName,
      },
    };
    const secretMapRef = {
      secretRef: {
        name: obcName,
      },
    };

    const containers: ContainerSpec[] = _.get(
      requestDeployment,
      'spec.template.spec.containers',
      [],
    );
    const patches = containers.reduce((patch, container, i) => {
      if (_.isEmpty(container.envFrom)) {
        patch.push({
          op: 'add',
          path: `/spec/template/spec/containers/${i}/envFrom`,
          value: [configMapRef],
        });
        patch.push({
          op: 'add',
          path: `/spec/template/spec/containers/${i}/envFrom/-`,
          value: secretMapRef,
        });
      } else {
        patch.push({
          op: 'add',
          path: `/spec/template/spec/containers/${i}/envFrom/-`,
          value: configMapRef,
        });
        patch.push({
          op: 'add',
          path: `/spec/template/spec/containers/${i}/envFrom/-`,
          value: secretMapRef,
        });
      }
      return patch;
    }, []);
    return patches;
  };

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    handlePromise(
      k8sPatch(DeploymentModel, requestDeployment, getPatches()),
      (res) => {
        history.push(`${resourceObjPath(res, referenceFor(res))}/environment`);
        close();
      },
      () => {
        close();
      },
    );
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Attach OBC to a Deployment</ModalTitle>
      <ModalBody>
        <label htmlFor="dropdown-selectbox" className="control-label co-required">
          Deployment Name
        </label>
        <Dropdown
          items={deploymentNames}
          dropDownClassName="dropdown--full-width"
          id="dropdown-selectbox"
          onChange={(deploymentName) => setRequestedDeployment(deploymentObjects[deploymentName])}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={!inProgress}
        submitText="Attach"
        cancel={cancel}
      />
    </form>
  );
});

const AttachDeploymentToOBCFirehose: React.FC<AttachDeploymentToOBCFirehoseProps> = (props) => {
  const { namespace } = props;
  const resource = [{ kind: DeploymentModel.kind, namespace, prop: 'deployments', isList: true }];
  return (
    <Firehose resources={resource}>
      <AttachDeploymentToOBCModal {...props} />
    </Firehose>
  );
};

const attachDeploymentToOBCModalStateToProps = ({ UI }) => {
  const namespace = UI.getIn(['activeNamespace']);
  return {
    namespace,
  };
};

const AttachDeploymentToOBCModalConnected = connect(attachDeploymentToOBCModalStateToProps)(
  AttachDeploymentToOBCFirehose,
);

export const attachDeploymentToOBCModal = createModalLauncher(AttachDeploymentToOBCModalConnected);

type AttachDeploymentToOBCModalProps = HandlePromiseProps &
  ModalComponentProps & {
    kind: K8sKind;
    resource: K8sResourceKind;
    deployments?: FirehoseResult<K8sResourceKind[]>;
  };

type AttachDeploymentToOBCFirehoseProps = ModalComponentProps & {
  kind: K8sKind;
  resource: K8sResourceKind;
  namespace: string;
};
