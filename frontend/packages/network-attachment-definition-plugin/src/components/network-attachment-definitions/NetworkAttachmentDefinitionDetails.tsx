import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  ResourceSummary,
  ScrollToTopOnMount,
  SectionHeading,
  StatusBox,
} from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import {
  networkTypes,
  ovnKubernetesNetworkType,
  ovnKubernetesSecondaryLocalnet,
} from '../../constants/constants';
import { getConfigAsJSON, getType } from '../../selectors';
import { NetworkAttachmentDefinitionKind } from '../../types';

export const getBasicID = <A extends K8sResourceKind = K8sResourceKind>(entity: A) =>
  `${getNamespace(entity)}-${getName(entity)}`;

export const prefixedID = (idPrefix: string, id: string) =>
  idPrefix && id ? `${idPrefix}-${id}` : null;

// FIXME: Use DetailsItem from common console utils.
export const DetailsItem: React.FC<DetailsItemProps> = ({
  title,
  isNotAvail = false,
  idValue,
  valueClassName,
  children,
}) => {
  return (
    <>
      <dt>{title}</dt>
      <dd id={idValue} className={valueClassName}>
        {isNotAvail ? <span className="text-secondary">Not available</span> : children}
      </dd>
    </>
  );
};

export const NetAttachDefinitionSummary: React.FC<NetAttachDefinitionSummaryProps> = ({
  netAttachDef,
}) => {
  const { t } = useTranslation();
  const nadConfig = getConfigAsJSON(netAttachDef);
  const type = getType(nadConfig);
  const typeLabel = React.useMemo(() => {
    if (type === ovnKubernetesNetworkType && nadConfig?.topology === 'localnet') {
      return networkTypes[ovnKubernetesSecondaryLocalnet];
    }
    return _.get(networkTypes, [type], null) || type;
  }, [nadConfig?.topology, type]);
  const id = getBasicID(netAttachDef);

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading
          text={t('network-attachment-definition-plugin~NetworkAttachmentDefinition details')}
        />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={netAttachDef} />
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <DetailsItem
                title={t('network-attachment-definition-plugin~Type')}
                idValue={prefixedID(id, 'type')}
                isNotAvail={!type}
              >
                {typeLabel}
              </DetailsItem>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

export const NetworkAttachmentDefinitionDetails: React.FC<NetAttachDefDetailsProps> = (props) => {
  const { obj: netAttachDef } = props;

  return (
    <StatusBox data={netAttachDef} loaded={!!netAttachDef}>
      <ScrollToTopOnMount />
      <NetAttachDefinitionSummary netAttachDef={netAttachDef} />
    </StatusBox>
  );
};

type NetAttachDefinitionSummaryProps = {
  netAttachDef: NetworkAttachmentDefinitionKind;
};

type NetAttachDefDetailsProps = {
  obj: NetworkAttachmentDefinitionKind;
};

type DetailsItemProps = {
  title: string;
  idValue?: string;
  isNotAvail?: boolean;
  valueClassName?: string;
  children: React.ReactNode;
};

export default NetworkAttachmentDefinitionDetails;
