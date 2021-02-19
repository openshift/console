import * as React from 'react';
import { match as RouterMatch } from 'react-router';
import { FormGroup, Form, TextVariants } from '@patternfly/react-core';
import { resourcePathFromModel, BreadCrumbs } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';
import { referenceForModel, NodeKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { getNodesByHostNameLabel, hasNoTaints } from '../../utils';
import { updateLocalVolumeDiscovery, createLocalVolumeDiscovery } from './request';
import { LocalVolumeDiscovery as AutoDetectVolumeModel } from '../../models';
import { DISCOVERY_CR_NAME } from '../../constants';
import { LocalVolumeDiscoveryBody } from './body';
import { FormFooter } from '../common/form-footer';
import { LocalVolumeDiscoveryHeader } from './header';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import '../../common.scss';
import { nodeResource } from '../../resources';
import { useTranslation } from 'react-i18next';

const makeLocalVolumeDiscoverRequest = async (
  nodes: string[],
  ns: string,
  setError: React.Dispatch<React.SetStateAction<string>>,
  setProgress: React.Dispatch<React.SetStateAction<boolean>>,
  url: string,
) => {
  setProgress(true);
  try {
    await updateLocalVolumeDiscovery(nodes, ns, setError);
    history.push(url);
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        await createLocalVolumeDiscovery(nodes, ns, setError);
        history.push(url);
      } catch (createError) {
        setError(createError.message);
      }
    } else {
      setError(error.message);
    }
  } finally {
    setProgress(false);
  }
};

export const CreateLocalVolumeDiscovery: React.FC<CreateLocalVolumeDiscoveryProps> = ({
  match,
}) => {
  const { appName, ns } = match.params;
  const { t } = useTranslation();

  const [nodesData, nodesLoaded, nodesLoadError] = useK8sWatchResource<NodeKind[]>(nodeResource);
  const [allNodes, setAllNodes] = React.useState([]);
  const [selectNodes, setSelectNodes] = React.useState([]);
  const [showSelectNodes, setShowSelectNodes] = React.useState(false);
  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  React.useEffect(() => {
    if (nodesLoaded && !nodesLoadError && nodesData.length !== 0) {
      const filteredNodes: NodeKind[] = nodesData.filter(hasNoTaints);
      setAllNodes(filteredNodes);
    }
  }, [nodesData, nodesLoadError, nodesLoaded]);

  const nodes: NodeKind[] = showSelectNodes ? selectNodes : allNodes;
  const resourcePath = resourcePathFromModel(ClusterServiceVersionModel, appName, ns);

  const onSubmit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const nodesByHostNameLabel: string[] = getNodesByHostNameLabel(nodes);
    const redirectionUrl = `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
      AutoDetectVolumeModel,
    )}/${DISCOVERY_CR_NAME}`;
    makeLocalVolumeDiscoverRequest(nodesByHostNameLabel, ns, setError, setProgress, redirectionUrl);
  };

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: t('lso-plugin~Local Storage'),
                path: resourcePath,
              },
              { name: t('lso-plugin~Create Local Volume Discovery'), path: '' },
            ]}
          />
        </div>
        <LocalVolumeDiscoveryHeader variant={TextVariants.h1} />
      </div>
      <Form
        noValidate={false}
        className="co-m-pane__body lso-form-body__node-list"
        onSubmit={onSubmit}
      >
        <FormGroup
          label={t('lso-plugin~Node Selector')}
          fieldId="auto-detect-volume--radio-group-node-selector"
        >
          <LocalVolumeDiscoveryBody
            allNodes={allNodes}
            selectNodes={selectNodes}
            showSelectNodes={showSelectNodes}
            setShowSelectNodes={() => setShowSelectNodes(!showSelectNodes)}
            setSelectNodes={setSelectNodes}
          />
        </FormGroup>
        <FormFooter
          inProgress={inProgress}
          errorMessage={errorMessage}
          disableNext={nodes.length < 1}
          cancelUrl={resourcePath}
        />
      </Form>
    </>
  );
};

type CreateLocalVolumeDiscoveryProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
};
