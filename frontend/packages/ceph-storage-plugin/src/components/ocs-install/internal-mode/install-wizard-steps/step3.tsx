import * as React from 'react';
import { pluralize, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { getName } from '@console/shared';
import { TotalCapacityText, OSD_CAPACITY_SIZES } from '../../../../utils/osd-size-dropdown';
import { VALIDATIONS, ValidationMessage } from '../../../../utils/common-ocs-install-el';
import { getNodeInfo } from '../../../../utils/install';
import { InternalClusterState } from '../reducer';
import {
  ReviewListTitle,
  ReviewListBody,
  NodesCard,
  RequestErrors,
} from '../../wizard-steps/review-and-create';

export const ReviewAndCreate: React.FC<ReviewAndCreateProps> = ({
  state,
  errorMessage,
  inProgress,
}) => {
  const { nodes, enableEncryption, capacity, enableMinimal, storageClass } = state;
  const { cpu, memory, zones } = getNodeInfo(state.nodes);
  const scName = getName(storageClass);
  const emptyRequiredField = !nodes.length && !zones.size && !scName && !memory && !cpu;

  return (
    <>
      <TextContent className="ocs-install-wizard__text-content">
        <Text component={TextVariants.h2}>Review storage cluster</Text>
      </TextContent>
      <dl>
        <ReviewListTitle text="Capacity and nodes" />
        <ReviewListBody hideIcon>
          Requested Cluster Capacity:&nbsp;
          <span className="text-secondary">
            {OSD_CAPACITY_SIZES[capacity].title}&nbsp;(
            <TotalCapacityText capacity={capacity} />)
          </span>
        </ReviewListBody>
        <ReviewListBody
          noValue={!scName}
          validation={!scName && !emptyRequiredField && VALIDATIONS.STORAGECLASS}
        >
          Storage Class: <span className="text-secondary">{scName ?? 'None'}</span>
        </ReviewListBody>
        <ReviewListBody noValue={!nodes.length}>
          <div>
            <p>{pluralize(nodes.length, 'node')} selected</p>
            <NodesCard nodes={nodes} />
          </div>
        </ReviewListBody>
        <ReviewListBody
          validation={enableMinimal && !emptyRequiredField && VALIDATIONS.MINIMAL}
          noValue={!cpu || !memory}
        >
          <p>
            Total CPU and memory of {cpu} CPU and {humanizeBinaryBytes(memory).string}
          </p>
        </ReviewListBody>
        <ReviewListBody noValue={!zones.size}>
          <p>{pluralize(zones.size, 'zone')}</p>
        </ReviewListBody>
        {/* @TODO: Update the check from Configure when adding more items */}
        {enableEncryption && <ReviewListTitle text="Configure" />}
        {enableEncryption && (
          <ReviewListBody>
            <p>Enable Encryption</p>
          </ReviewListBody>
        )}
      </dl>
      {emptyRequiredField && (
        <ValidationMessage
          className="ocs-install-wizard__review-alert"
          validation={VALIDATIONS.ALLREQUIREDFIELDS}
        />
      )}
      <RequestErrors errorMessage={errorMessage} inProgress={inProgress} />
    </>
  );
};

type ReviewAndCreateProps = {
  errorMessage: string;
  inProgress: boolean;
  state: InternalClusterState;
};
