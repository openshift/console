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
import { humanizeBinaryBytes, Dropdown } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassResourceKind, NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';
import { State, Action } from '../attached-devices/create-sc/state';
import { scResource } from '../../../constants/resources';
import { arbiterText } from '../../../constants';
import { getZone, isArbiterSC } from '../../../utils/install';
import { AdvancedSubscription } from '../subscription-icon';

export const SelectNodesText: React.FC<SelectNodesTextProps> = React.memo(({ text, replica }) => {
  const { t } = useTranslation();
  return (
    <TextContent>
      <Text>{text}</Text>
      <Text>
        <Trans t={t} ns="ceph-storage-plugin" i18nKey="nodesText">
          The selected nodes will be labeled with&nbsp;
          <Label color="blue">cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</Label>
          &nbsp;(unless they are already labeled). {{ replica }} of the selected nodes will be used
          for initial deployment. The remaining nodes will be used by OpenShift as scheduling
          targets for OCS scaling.
        </Trans>
      </Text>
    </TextContent>
  );
});

type SelectNodesTextProps = { text: string; replica: number };

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

export const StretchClusterFormGroup: React.FC<stretchClusterFormGroupProps> = ({
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
    (): boolean => !storageClassData?.some((sc) => isArbiterSC(sc, pvData, nodesDataMemoized)),
    [nodesDataMemoized, pvData, storageClassData],
  );

  React.useEffect(() => {
    if (!stretchClusterChecked && isArbiterDisabled()) {
      dispatch({ type: 'setStretchClusterChecked', value: false });
    }
    if (stretchClusterChecked) {
      const uniqZones: Set<string> = new Set(nodesDataMemoized.map((node) => getZone(node)));
      const uniqSelectedNodesZones: Set<string> = new Set(nodes.map((node) => getZone(node)));
      setZones(_.difference([...uniqZones], [...uniqSelectedNodesZones]));
    }
  }, [storageClass, stretchClusterChecked, nodes, isArbiterDisabled, dispatch, nodesDataMemoized]);

  React.useEffect(() => {
    if (stretchClusterChecked) {
      setZonesOptions(_.zipObject(zones, zones));
      dispatch({ type: 'setSelectedArbiterZone', value: zones[0] });
    }
  }, [dispatch, stretchClusterChecked, zones]);

  return (
    <FormGroup fieldId="arbiter-cluster" label={t('ceph-storage-plugin~Stretch Cluster')}>
      <Checkbox
        aria-label={t('ceph-storage-plugin~Enable Arbiter')}
        id="arbiter-cluster"
        isChecked={stretchClusterChecked}
        label={<AdvancedSubscription prefix={t('ceph-storage-plugin~Enable arbiter')} />}
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

type stretchClusterFormGroupProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  pvData: K8sResourceKind[];
  nodesData: NodeKind[];
};
