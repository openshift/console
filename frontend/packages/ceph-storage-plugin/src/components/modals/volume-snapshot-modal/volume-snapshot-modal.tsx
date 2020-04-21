import * as React from 'react';

import {
  Dropdown,
  ExternalLink,
  Firehose,
  FirehoseResourcesResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import {
  K8sResourceKind,
  apiVersionForModel,
  k8sCreate,
  k8sPatch,
} from '@console/internal/module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import { SnapshotScheduleModel, VolumeSnapshotModel } from '../../../models';
import { cronLink, numberOfSnapshot, snapshotTypes } from './volume-snapshot';
import { getName, getNamespace } from '@console/shared';

import { PersistentVolumeClaimModel } from '@console/internal/models';
import './_volume-snapshot-modal.scss';

export type VolumeSnapshotModalProps = {
  pvcData?: FirehoseResourcesResult;
} & HandlePromiseProps &
  ModalComponentProps;

export const VolumeSnapshotModal = withHandlePromise((props: VolumeSnapshotModalProps) => {
  const { close, cancel, pvcData, errorMessage, inProgress, handlePromise } = props;
  const resource = pvcData.data as K8sResourceKind;
  const [snapshotCount, setSnapshotCount] = React.useState(3); // For all schedules
  const [snapshotWeek, setSnapshotWeek] = React.useState(0); // For Weekly schedule
  const [snapshotTime, setSnapshotTime] = React.useState('00:01'); // For weekly and monthly
  const [snapshotMonth, setSnapshotMonth] = React.useState(1); // For monthly schedule
  const [snapshotName, setSnapshotName] = React.useState<string>();
  const [scheduleLabel, setScheduleLabel] = React.useState<string>();
  const [scheduleType, setScheduleType] = React.useState(snapshotTypes.Single);

  const makeLabel = (): string => {
    const arr = snapshotTime.split(':');
    const newLabel = `${arr?.[1]} ${arr?.[0]}`;
    if (scheduleType === snapshotTypes.Monthly) {
      return `${newLabel} ${snapshotMonth} * *`;
    }
    if (scheduleType === snapshotTypes.Weekly) {
      return `${newLabel} * * ${snapshotWeek}`;
    }
    return newLabel;
  };

  const WeeklyElements: React.FC = () => (
    <FormGroup
      className="ceph-volume-snapshot-modal__input"
      fieldId="snapshot-day"
      label="Day of week"
    >
      <TextInput
        type="number"
        value={snapshotWeek}
        onChange={(value) => setSnapshotWeek(Number(value))}
        className="ceph-volume-snapshot-modal--label"
        aria-labelledby="snapshot-day"
      />
    </FormGroup>
  );

  const MonthlyElements: React.FC = () => (
    <FormGroup
      className="ceph-volume-snapshot-modal__input"
      fieldId="snapshot-month"
      label="Day of month"
    >
      <TextInput
        type="number"
        name="snapshot-modal__month"
        value={snapshotMonth}
        onChange={(value) => setSnapshotMonth(Number(value))}
        className="ceph-volume-snapshot-modal__label"
        aria-labelledby="snapshot-month"
      />
    </FormGroup>
  );

  const CronElements: React.FC = () => (
    <FormGroup
      className="ceph-volume-snapshot-modal__input"
      fieldId="snapshot-schedule"
      helperText="* Scheduled for cluster local time"
      isRequired
    >
      <label className="pf-c-form__label" htmlFor="snapshot-modal__schedule">
        <span className="pf-c-form__label-text">Label</span>
        <ExternalLink
          additionalClassName="ceph-volume-snapshot-modal__input--link"
          href={cronLink}
          text="Whats this?"
        />
      </label>
      <TextInput
        type="text"
        name="snapshot-modal__schedule"
        value={scheduleLabel}
        onChange={(value) => setScheduleLabel(value)}
        className="ceph-volume-snapshot-modal__label"
        placeholder="* * 5 * *"
        aria-labelledby="snapshot-schedule"
      />
    </FormGroup>
  );

  const OtherElements: React.FC = () => (
    <div className="ceph-volume-snapshot-modal__input--inline">
      {scheduleType === snapshotTypes.Monthly ? <MonthlyElements /> : <WeeklyElements />}
      <FormGroup className="ceph-volume-snapshot-modal__input" fieldId="snapshot-time" label="Time">
        <TextInput
          type="time"
          name="snapshot-modal__time-week"
          value={snapshotTime}
          onChange={setSnapshotTime}
          className="ceph-volume-snapshot-modal__label"
          aria-labelledby="snapshot-time"
        />
      </FormGroup>
    </div>
  );

  const ScheduleElements: React.FC = () => (
    <Form>
      {scheduleType === snapshotTypes.CronJob ? <CronElements /> : <OtherElements />}
      <FormGroup
        className="ceph-volume-snapshot-modal__input--group"
        label="Keep"
        fieldId="snapshot-count"
        helperText="*Older snapshots will be deleted automatically"
        isRequired
      >
        <div className="ceph-volume-snapshot-modal__input--keep">
          <Dropdown
            items={numberOfSnapshot}
            selectedKey={snapshotCount}
            onChange={(value) => setSnapshotCount(Number(value))}
            className="ceph-volume-snapshot-modal__input--count"
          />
          <span className="ceph-volume-snapshot-modal__span--keep">last snapshots</span>
        </div>
      </FormGroup>
    </Form>
  );

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const ns = getNamespace(resource);
    const pvcName = getName(resource);
    if (scheduleType === snapshotTypes.Single) {
      const snapshotTemplate: K8sResourceKind = {
        apiVersion: VolumeSnapshotModel.apiVersion,
        kind: VolumeSnapshotModel.kind,
        metadata: {
          name: snapshotName,
          namespace: ns,
        },
        spec: {
          source: {
            persistentVolumeClaimName: pvcName,
          },
        },
      };
      handlePromise(k8sCreate(VolumeSnapshotModel, snapshotTemplate))
        .then(close)
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);
        });
    } else {
      const pvcLabel = Math.random()
        .toString(36) // To generate a random string with [a-z] and [0-9]
        .slice(2); // To get the part of string which is started from position 2
      const scheduleTemplate: K8sResourceKind = {
        apiVersion: apiVersionForModel(SnapshotScheduleModel),
        kind: SnapshotScheduleModel.kind,
        metadata: {
          name: snapshotName,
          namespace: ns,
        },
        spec: {
          claimSelector: {
            matchLabels: {
              thislabel: `schedule-${pvcLabel}`,
            },
          },
          disabled: false,
          retention: {
            maxCount: Number(snapshotCount),
          },
          schedule: scheduleType === snapshotTypes.CronJob ? scheduleLabel : makeLabel(),
        },
      };
      const patch = [
        {
          op: 'add',
          path: '/metadata/labels/thislabel',
          value: `schedule-${pvcLabel}`,
        },
      ];

      handlePromise(k8sPatch(PersistentVolumeClaimModel, resource, patch)) // eslint-disable-line promise/no-nesting
        .then(() => {
          handlePromise(k8sCreate(SnapshotScheduleModel, scheduleTemplate)) // eslint-disable-line promise/no-nesting
            .then(close)
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.log(error);
            });
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.log(error);
        });
    }
  };

  return (
    <Form onSubmit={submit} name="form">
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Create Snapshot</ModalTitle>
        <ModalBody>
          <p>Creating snapshot for {getName(resource)}</p>
          <FormGroup
            className="ceph-volume-snapshot-modal__input"
            label="Name"
            isRequired
            fieldId="snapshot-name"
          >
            <TextInput
              type="text"
              name="snapshot-name"
              value={snapshotName}
              onChange={setSnapshotName}
              placeholder={`${getName(resource) || 'pvc'}-snapshot`}
              aria-labelledby="snapshot-name"
            />
          </FormGroup>
          <FormGroup
            className="ceph-volume-snapshot-modal__input"
            label="Schedule"
            fieldId="snapshot-type"
          >
            <Dropdown
              dropDownClassName="dropdown--full-width"
              items={snapshotTypes}
              selectedKey={scheduleType}
              onChange={(value) => setScheduleType(snapshotTypes[value])}
            />
            <div className="co-form-subsection">
              {scheduleType === snapshotTypes.Single ? null : <ScheduleElements />}
            </div>
          </FormGroup>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={inProgress}
          errorMessage={errorMessage}
          submitText="Create"
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

type VolumeSnapshotModalWithFireHoseProps = {
  resource: K8sResourceKind;
} & ModalComponentProps;

export const VolumeSnapshotModalWithFireHose: React.FC<VolumeSnapshotModalWithFireHoseProps> = ({
  resource,
  ...rest
}) => (
  <Firehose
    resources={[
      {
        kind: resource?.kind || PersistentVolumeClaimModel.kind,
        prop: 'pvcData',
        namespace: resource?.metadata?.namespace,
        isList: false,
        name: resource?.metadata?.name,
      },
    ]}
  >
    <VolumeSnapshotModal {...rest} />
  </Firehose>
);

export const volumeSnapshotModal = createModalLauncher(VolumeSnapshotModalWithFireHose);
