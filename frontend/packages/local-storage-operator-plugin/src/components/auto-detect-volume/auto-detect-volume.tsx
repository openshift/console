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
import { k8sCreate, k8sPatch, referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import { fetchK8s } from '@console/internal/graphql/client';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { getNodes, getLabelIndex } from '../../utils';
import { AutoDetectVolumeInner, AutoDetectVolumeHeader } from './auto-detect-volume-inner';
import { getDiscoveryRequestData } from './discovery-request-data';
import { LocalVolumeDiscovery as AutoDetectVolumeModel } from '../../models';
import { initialState, reducer } from './state';
import {
  DISCOVERY_CR_NAME,
  LOCAL_STORAGE_NAMESPACE,
  HOSTNAME_LABEL_KEY,
  AUTO_DISCOVER_ERR_MSG,
  LABEL_OPERATOR,
} from '../../constants';

const AutoDetectVolume: React.FC = withHandlePromise<AutoDetectVolumeProps & HandlePromiseProps>(
  (props) => {
    const { match, handlePromise, inProgress, errorMessage } = props;
    const { appName, ns } = match.params;
    const [state, dispatch] = React.useReducer(reducer, initialState);

    const onSubmit = (event: React.FormEvent<EventTarget>) => {
      event.preventDefault();

      handlePromise(
        fetchK8s(AutoDetectVolumeModel, DISCOVERY_CR_NAME, LOCAL_STORAGE_NAMESPACE)
          .then((discoveryRes: K8sResourceKind) => {
            const nodeSelectorTerms = discoveryRes?.spec?.nodeSelector?.nodeSelectorTerms;
            const [selectorIndex, expIndex] = nodeSelectorTerms
              ? getLabelIndex(nodeSelectorTerms, HOSTNAME_LABEL_KEY, LABEL_OPERATOR)
              : [-1, -1];
            if (selectorIndex !== -1 && expIndex !== -1) {
              const nodes = new Set(
                discoveryRes?.spec?.nodeSelector?.nodeSelectorTerms?.[
                  selectorIndex
                ]?.matchExpressions?.[expIndex]?.values,
              );
              const selectedNodes = getNodes(
                state.showNodesListOnADV,
                state.allNodeNamesOnADV,
                state.nodeNamesForLVS,
              );
              selectedNodes.forEach((name) => nodes.add(name));
              const patch = [
                {
                  op: 'replace',
                  path: `/spec/nodeSelector/nodeSelectorTerms/${selectorIndex}/matchExpressions/${expIndex}/values`,
                  value: Array.from(nodes),
                },
              ];
              return k8sPatch(AutoDetectVolumeModel, discoveryRes, patch);
            }
            throw new Error(AUTO_DISCOVER_ERR_MSG);
          })
          .catch((err) => {
            // handle AUTO_DISCOVER_ERR_MSG and throw to next catch block to show the message
            if (err.message === AUTO_DISCOVER_ERR_MSG) {
              throw err;
            }
            const requestData = getDiscoveryRequestData(state);
            return k8sCreate(AutoDetectVolumeModel, requestData);
          })
          // eslint-disable-next-line promise/catch-or-return
          .then((resource) => history.push(resourceObjPath(resource, referenceFor(resource)))),
      );
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
                { name: `Auto Detect Volume`, path: '' },
              ]}
            />
          </div>

          <AutoDetectVolumeHeader />
        </div>
        <Form noValidate={false} className="co-m-pane__body co-m-pane__form" onSubmit={onSubmit}>
          <AutoDetectVolumeInner state={state} dispatch={dispatch} />
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup>
              <Button
                type="submit"
                variant="primary"
                isDisabled={state.showNodesListOnADV && state.nodeNamesForLVS?.length < 1}
              >
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
  },
);

type AutoDetectVolumeProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
} & HandlePromiseProps;

export default AutoDetectVolume;
