import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextContent,
  Text,
  TextVariants,
  Card,
  CardBody,
  AlertVariant,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
  RedExclamationCircleIcon,
} from '@console/shared/src';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { MINIMUM_NODES, NO_PROVISIONER } from '../../../../constants';
import {
  capacityAndNodesValidate,
  getAllZone,
  getTotalCpu,
  getTotalMemory,
} from '../../../../utils/create-storage-system';
import { OSD_CAPACITY_SIZES, TotalCapacityText } from '../../../../utils/osd-size-dropdown';
import {
  ValidationMessage,
  VALIDATIONS,
  ValidationType,
} from '../../../../utils/common-ocs-install-el';
import { WizardNodeState, WizardState } from '../../reducer';
import './review-and-create-step.scss';

const NodesCard: React.FC<NodeCardProps> = ({ nodes }) =>
  !!nodes.length && (
    <Card isCompact isFlat component="div" className=".odf-review-and-create__card">
      <CardBody isFilled className=".odf-review-and-create__card-body">
        <TextContent>
          {nodes.map((node) => (
            <Text key={node.name} component={TextVariants.small}>
              {node.name}
            </Text>
          ))}
        </TextContent>
      </CardBody>
    </Card>
  );

type NodeCardProps = { nodes: WizardNodeState[] };

const REVIEW_ICON_MAP = {
  [AlertVariant.success]: GreenCheckCircleIcon,
  [AlertVariant.warning]: YellowExclamationTriangleIcon,
  [AlertVariant.info]: BlueInfoCircleIcon,
  [AlertVariant.danger]: RedExclamationCircleIcon,
};

export const ReviewListTitle: React.FC<ReviewListTitleProps> = ({ text }) => (
  <dt>
    <TextContent>
      <Text component={TextVariants.h4}>{text}</Text>
    </TextContent>
  </dt>
);

type ReviewListTitleProps = { text: string };

export const ReviewListBody: React.FC<ReviewListBodyProps> = ({
  children,
  validation,
  hideIcon = false,
  noValue = undefined,
}) => {
  const { t } = useTranslation();

  const alert = VALIDATIONS(validation, t);
  const Icon = noValue
    ? REVIEW_ICON_MAP[AlertVariant.danger]
    : REVIEW_ICON_MAP[alert?.variant || AlertVariant.success];

  return (
    <dd className="odf-review-and-create__body">
      {alert?.variant || !hideIcon ? (
        <Split>
          <SplitItem>
            <Icon className="odf-review-and-create__icon" />
          </SplitItem>
          <SplitItem isFilled>
            {children}
            {alert?.variant ? <ValidationMessage validation={validation} /> : null}
          </SplitItem>
        </Split>
      ) : (
        children
      )}
    </dd>
  );
};

type ReviewListBodyProps = {
  children: React.ReactNode;
  hideIcon?: boolean;
  noValue?: boolean;
  validation?: ValidationType;
};

export const ReviewAndCreate: React.FC<ReviewAndCreateProps> = ({ state }) => {
  const { t } = useTranslation();

  const { storageClass } = state;
  const { nodes, enableArbiter, capacity } = state.capacityAndNodes;

  const validations = [...capacityAndNodesValidate(nodes, enableArbiter)];
  const isNoProvisioner = storageClass.provisioner === NO_PROVISIONER;

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  return (
    <dl>
      <ReviewListTitle text={t('ceph-storage-plugin~Backing storage')} />
      <ReviewListBody hideIcon>
        <span>{t('ceph-storage-plugin~StorageClass:')}</span>&nbsp;
        <span className="text-secondary">{storageClass.name}</span>
      </ReviewListBody>
      <ReviewListTitle text={t('ceph-storage-plugin~Capacity and nodes')} />
      <ReviewListBody hideIcon>
        <span>{t('ceph-storage-plugin~Requested Cluster Capacity:')}</span>&nbsp;
        <span className="text-secondary">
          {isNoProvisioner ? (
            <>
              {OSD_CAPACITY_SIZES[capacity]} TiB&nbsp;
              <TotalCapacityText capacity={capacity} />
            </>
          ) : (
            capacity
          )}
        </span>
      </ReviewListBody>
      <ReviewListBody noValue={nodes.length < MINIMUM_NODES}>
        <div>
          <p>
            {t('ceph-storage-plugin~{{nodeCount, number}} node', {
              nodeCount: nodes.length,
              count: nodes.length,
            })}{' '}
            {t('ceph-storage-plugin~selected')}
          </p>
          <NodesCard nodes={nodes} />
        </div>
      </ReviewListBody>
      <ReviewListBody
        validation={validations.includes(ValidationType.MINIMAL) && ValidationType.MINIMAL}
        noValue={!totalCpu || !totalMemory}
      >
        <p>
          {t('ceph-storage-plugin~Total CPU and memory of {{cpu, number}} CPU and {{memory}}', {
            cpu: totalCpu,
            memory: humanizeBinaryBytes(totalMemory).string,
          })}
        </p>
      </ReviewListBody>
      <ReviewListBody>
        <p>
          {t('ceph-storage-plugin~{{zoneCount, number}} zone', {
            zoneCount: zones.size,
            count: zones.size,
          })}
        </p>
      </ReviewListBody>
    </dl>
  );
};

type ReviewAndCreateProps = {
  state: WizardState;
};
