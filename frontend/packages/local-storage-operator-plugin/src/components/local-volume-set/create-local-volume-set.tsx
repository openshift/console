import * as React from 'react';
import { match as RouterMatch } from 'react-router';
import { ActionGroup, Button, Form } from '@patternfly/react-core';
import {
  resourcePathFromModel,
  BreadCrumbs,
  resourceObjPath,
  withHandlePromise,
  HandlePromiseProps,
  ButtonBar,
} from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';
import { k8sCreate, referenceFor, NodeKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName } from '@console/shared';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { LocalVolumeSetModel } from '../../models';
import { LocalVolumeSetHeader, LocalVolumeSetInner } from './local-volume-set-inner';
import { reducer, initialState } from './state';
import { nodeResource } from '../../constants/resources';
import { hasTaints } from '../../utils';
import { getLocalVolumeSetRequestData } from './local-volume-set-request-data';

import './create-local-volume-set.scss';

const CreateLocalVolumeSet: React.FC = withHandlePromise<
  CreateLocalVolumeSetProps & HandlePromiseProps
>((props) => {
  const { match, handlePromise, inProgress, errorMessage } = props;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [nodeData, nodeLoaded, nodeLoadError] = useK8sWatchResource<NodeKind[]>(nodeResource);

  const { appName, ns } = match.params;
  const modelName = LocalVolumeSetModel.label;

  React.useEffect(() => {
    if ((nodeLoadError || nodeData.length === 0) && nodeLoaded) {
      dispatch({ type: 'setNodeNamesForLVS', value: [] });
    } else if (nodeLoaded) {
      const allNodeNames = nodeData.filter((node) => !hasTaints(node)).map((node) => getName(node));
      dispatch({ type: 'setNodeNamesForLVS', value: allNodeNames });
    }
  }, [nodeData, nodeLoaded, nodeLoadError]);

  const onSubmit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const requestData = getLocalVolumeSetRequestData(state);

    handlePromise(k8sCreate(LocalVolumeSetModel, requestData), (resource) =>
      history.push(resourceObjPath(resource, referenceFor(resource))),
    );
  };

  const getDisabledCondition = () => {
    if (!state.volumeSetName.trim().length) return true;
    if (state.showNodesListOnLVS && state.nodeNames.length < 1) return true;
    return false;
  };

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: 'Local Storage',
                path: resourcePathFromModel(ClusterServiceVersionModel, appName, ns),
              },
              { name: `Create ${modelName}`, path: '' },
            ]}
          />
        </div>
        <LocalVolumeSetHeader />
      </div>
      <Form noValidate={false} className="co-m-pane__body co-m-pane__form" onSubmit={onSubmit}>
        <LocalVolumeSetInner dispatch={dispatch} state={state} />
        <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
          <ActionGroup>
            <Button type="submit" variant="primary" isDisabled={getDisabledCondition()}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </>
  );
});

type CreateLocalVolumeSetProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
} & HandlePromiseProps;

export default CreateLocalVolumeSet;
