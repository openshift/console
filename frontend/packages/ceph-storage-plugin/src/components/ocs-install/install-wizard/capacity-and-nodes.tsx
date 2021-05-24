import * as React from 'react';

import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  Alert,
  AlertActionCloseButton,
  Checkbox,
  FormGroup,
  Grid,
  GridItem,
  Label,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { humanizeBinaryBytes, Dropdown, FieldLevelHelp } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassResourceKind, NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { TechPreviewBadge, useDeepCompareMemoize, getName } from '@console/shared';
import { State, Action } from '../attached-devices-mode/reducer';
import { scResource } from '../../../resources';
import { arbiterText, MODES } from '../../../constants';
import { getZone, isArbiterSC } from '../../../utils/install';
import { AdvancedSubscription } from '../subscription-icon';
import { ActionType, InternalClusterAction, InternalClusterState } from '../internal-mode/reducer';
import './_capacity-and-nodes.scss';

const EnableArbiterLabel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="ocs-enable-arbiter-label">
      <span className="ocs-enable-arbiter-label__title--padding">
        {t('ceph-storage-plugin~Enable arbiter')}
      </span>
      <TechPreviewBadge />
      <AdvancedSubscription />
    </div>
  );
};

export const SelectNodesText: React.FC<SelectNodesTextProps> = React.memo(({ text }) => {
  const { t } = useTranslation();
  const label = 'cluster.ocs.openshift.io/openshift-storage=""';
  return (
    <TextContent>
      <Text>{text}</Text>
      <Text>
        <Trans t={t} ns="ceph-storage-plugin">
          If not labeled, the selected nodes are labeled <Label color="blue">{{ label }}</Label> to
          make them target hosts for OCS components.
        </Trans>
      </Text>
    </TextContent>
  );
});

type SelectNodesTextProps = { text: JSX.Element };

export const SelectNodesDetails: React.FC<SelectNodesDetailsProps> = React.memo(
  ({ nodes, cpu, zones, memory }) => {
    const { t } = useTranslation();

    return (
      <TextContent>
        <Text data-test-id="nodes-selected">
          {t('ceph-storage-plugin~{{nodeCount, number}} node', { nodeCount: nodes, count: nodes })}{' '}
          {t('ceph-storage-plugin~selected ({{cpu}} CPU and {{memory}} on ', {
            cpu,
            memory: humanizeBinaryBytes(memory).string,
          })}
          {t('ceph-storage-plugin~{{zoneCount, number}} zone', { zoneCount: zones, count: zones })}
          {')'}
        </Text>
      </TextContent>
    );
  },
);

type SelectNodesDetailsProps = {
  nodes: number;
  cpu: number;
  zones: number;
  memory: number;
};

export const EnableTaintNodes: React.FC<EnableTaintNodesProps> = ({ state, dispatch, mode }) => {
  const { t } = useTranslation();

  return (
    <Checkbox
      label={t('ceph-storage-plugin~Enable taint nodes')}
      description={t('ceph-storage-plugin~Selected nodes will be dedicated to OCS use only')}
      className="ocs-enable-taint"
      id="taint-nodes"
      isChecked={state.enableTaint}
      onChange={() =>
        mode === MODES.INTERNAL
          ? dispatch({ type: ActionType.SET_ENABLE_TAINT, payload: !state.enableTaint })
          : dispatch({ type: 'setEnableTaint', value: !state.enableTaint })
      }
    />
  );
};

type EnableTaintNodesProps = {
  state: State | InternalClusterState;
  dispatch: React.Dispatch<Action | InternalClusterAction>;
  mode: string;
};

export const StretchClusterFormGroup: React.FC<StretchClusterFormGroupProps> = ({
  state,
  dispatch,
  pvData,
  nodesData,
}) => {
  const { t } = useTranslation();
  const { stretchClusterChecked, selectedArbiterZone, storageClass, nodes } = state;
  const [zonesOption, setZonesOptions] = React.useState({});
  const [zones, setZones] = React.useState([]);
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);
  const [storageClassData] = useK8sWatchResource<StorageClassResourceKind[]>(scResource);

  const nodesDataMemoized: NodeKind[] = useDeepCompareMemoize(nodesData, true);

  const isArbiterDisabled = React.useCallback(
    (): boolean =>
      !storageClassData?.some((sc) => isArbiterSC(getName(sc), pvData, nodesDataMemoized)),
    [nodesDataMemoized, pvData, storageClassData],
  );

  React.useEffect(() => {
    if (!stretchClusterChecked && isArbiterDisabled()) {
      dispatch({ type: 'setStretchClusterChecked', value: false });
    }
    if (stretchClusterChecked) {
      const uniqZones: Set<string> = new Set(nodesDataMemoized.map((node) => getZone(node)));
      const uniqSelectedNodesZones: Set<string> = new Set(nodes.map((node) => getZone(node)));
      setZones(_.difference(_.compact([...uniqZones]), _.compact([...uniqSelectedNodesZones])));
    }
  }, [storageClass, stretchClusterChecked, nodes, isArbiterDisabled, dispatch, nodesDataMemoized]);

  React.useEffect(() => {
    if (stretchClusterChecked) {
      setZonesOptions(_.zipObject(zones, zones));
      dispatch({ type: 'setSelectedArbiterZone', value: zones[0] });
    }
  }, [dispatch, stretchClusterChecked, zones]);

  return (
    <FormGroup
      fieldId="arbiter-cluster"
      label={
        <>
          {t('ceph-storage-plugin~Stretch Cluster')}
          <FieldLevelHelp>
            {t(
              'ceph-storage-plugin~OpenShift Container Storage deployment in two data centers, with an arbiter node to settle quorum decisions.',
            )}
          </FieldLevelHelp>
        </>
      }
    >
      <Checkbox
        aria-label={t('ceph-storage-plugin~Enable Arbiter')}
        id="arbiter-cluster"
        isChecked={stretchClusterChecked}
        label={<EnableArbiterLabel />}
        description={t(
          'ceph-storage-plugin~To support high availability when two data centers can be used, enable arbiter to get the valid quorum between two data centers.',
        )}
        isDisabled={isArbiterDisabled()}
        onChange={(isChecked: boolean) =>
          dispatch({ type: 'setStretchClusterChecked', value: isChecked })
        }
      />
      {showInfoAlert && (
        <Alert
          aria-label={t('ceph-storage-plugin~Arbiter minimum requirements')}
          className="co-alert ceph-ocs-install__lso-install-alert"
          variant="info"
          title={t('ceph-storage-plugin~Arbiter minimum requirements')}
          isInline
          actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
        >
          {arbiterText(t)}
        </Alert>
      )}
      {stretchClusterChecked && (
        <Grid hasGutter>
          <GridItem span={5}>
            <FormGroup
              label={t('ceph-storage-plugin~Select an arbiter zone')}
              fieldId="arbiter-zone-dropdown"
              className="ceph-ocs-install__select-arbiter-zone"
            >
              <Dropdown
                aria-label={t('ceph-storage-plugin~Arbiter zone selection')}
                id="arbiter-zone-dropdown"
                dropDownClassName="dropdown dropdown--full-width"
                items={zonesOption}
                title={selectedArbiterZone}
                selectedKey={selectedArbiterZone}
                onChange={(type: string) =>
                  dispatch({ type: 'setSelectedArbiterZone', value: zonesOption[type] })
                }
              />
            </FormGroup>
          </GridItem>
        </Grid>
      )}
    </FormGroup>
  );
};

type StretchClusterFormGroupProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  pvData: K8sResourceKind[];
  nodesData: NodeKind[];
};
