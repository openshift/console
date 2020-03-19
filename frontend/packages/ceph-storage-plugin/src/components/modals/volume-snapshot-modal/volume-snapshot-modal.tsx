import * as React from 'react';
import * as momentTZ from 'moment-timezone';

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
  K8sResourceKindReference,
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
import {
  cronLink,
  numberOfSnapshot,
  snapshotTypes,
  snapshotDays,
  weekDays,
} from './volume-snapshot';
import { getName, getNamespace } from '@console/shared';

import { PersistentVolumeClaimModel } from '@console/internal/models';
import * as fuzzy from 'fuzzysearch';
import './_volume-snapshot-modal.scss';
import * as _ from 'lodash';

export type VolumeSnapshotModalProps = {
  pvcData?: FirehoseResourcesResult;
} & HandlePromiseProps &
  ModalComponentProps;

export const VolumeSnapshotModal = withHandlePromise((props: VolumeSnapshotModalProps) => {
  const { close, cancel, pvcData, errorMessage, inProgress, handlePromise } = props;
  const current = new Date();
  const resource = pvcData.data as K8sResourceKind;
  const [snapshotCount, setSnapshotCount] = React.useState(3); // For all schedules

  const [snapshotName, setSnapshotName] = React.useState<string>(
    `${getName(resource) || 'pvc'}-snapshot`,
  );
  const [scheduleLabel, setScheduleLabel] = React.useState<string>();
  const [scheduleType, setScheduleType] = React.useState(snapshotTypes.Single);
  const [scheduleTimezone, setScheduleTimezone] = React.useState<string>(
    `${momentTZ.tz.names().indexOf(momentTZ.tz.guess())}`,
  );
  const [snapshotDayOfMonth, setSnapshotDayOfMonth] = React.useState(
    momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).date() - 1,
  ); // For monthly schedule
  const [snapshotTime, setSnapshotTime] = React.useState(
    `${
      momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).hour() < 10
        ? `0${momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).hour()}`
        : momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).hour()
    }:${
      momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).minute() < 10
        ? `0${momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).minute()}`
        : momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).minute()
    }`,
  ); // For weekly and monthly
  const [snapshotWeek, setSnapshotWeek] = React.useState(
    momentTZ.tz(current, momentTZ.tz.names()[scheduleTimezone]).day(),
  ); // For Weekly schedule

  const newDefaultDate = (value) => {
    const timeZoneDate = momentTZ.tz(current, momentTZ.tz.names()[value]).date() - 1;
    setSnapshotDayOfMonth(timeZoneDate);
    return timeZoneDate;
  };

  const newDefaultTime = (value) => {
    const currentTZ = momentTZ.tz(current, momentTZ.tz.names()[value]);
    const timeZoneTime = `${currentTZ.hour() < 10 ? `0${currentTZ.hour()}` : currentTZ.hour()}:${
      currentTZ.minute() < 10 ? `0${currentTZ.minute()}` : currentTZ.minute()
    }`;
    setSnapshotTime(timeZoneTime);
    return timeZoneTime;
  };

  const newDefaultDay = (value) => {
    const timeZoneDay = momentTZ.tz(current, momentTZ.tz.names()[value]).day();
    setSnapshotWeek(timeZoneDay);
    return timeZoneDay;
  };

  const handleOnChangeTimezone = (value) => {
    setScheduleTimezone(value);
    newDefaultDate(value);
    newDefaultTime(value);
    newDefaultDay(value);
  };

  const makeLabel = (): string => {
    const arr = snapshotTime.split(':');
    let newLabel = '';
    const newDate = new Date();
    const finalDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      Number(snapshotDayOfMonth) + 1,
      Number(arr?.[0]),
      Number(arr?.[1]),
    ); // day number is index +1
    if (scheduleType === snapshotTypes.Monthly) {
      newLabel = `${finalDate.getUTCMinutes()} ${finalDate.getUTCHours()} ${finalDate.getUTCDate()} * *`;
    }
    if (scheduleType === snapshotTypes.Weekly) {
      newLabel = `${finalDate.getUTCMinutes()} ${finalDate.getUTCHours()} * * ${finalDate.getUTCDay()}`;
    }
    return newLabel;
  };

  const autocompleteFilter = (text, item) => {
    return fuzzy(_.toLower(text), _.toLower(item));
  };

  const WeeklyElements: React.FC = () => (
    <FormGroup
      className="ceph-volume-snapshot-modal__input"
      fieldId="snapshot-day"
      label="Day of week"
    >
      <Dropdown
        items={weekDays}
        selectedKey={snapshotWeek}
        onChange={setSnapshotWeek}
        className="ceph-volume-snapshot-modal__dropdown"
      />
    </FormGroup>
  );

  const MonthlyElements: React.FC = () => (
    <FormGroup
      className="ceph-volume-snapshot-modal__input"
      fieldId="snapshot-month"
      label="Day of month"
    >
      <Dropdown
        items={snapshotDays}
        selectedKey={snapshotDayOfMonth}
        onChange={setSnapshotDayOfMonth}
        menuClassName="ceph-volume-snapshot-modal__dropdown--overflow"
      />
    </FormGroup>
  );

  const CronElements: React.FC = () => (
    <FormGroup
      className="ceph-volume-snapshot-modal__input"
      fieldId="snapshot-schedule"
      helperText="* Scheduled for UTC"
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
    <div>
      <FormGroup
        className="ceph-volume-snapshot-modal__input"
        fieldId="snapshot-timezone"
        label="Time zone"
      >
        <Dropdown
          dropDownClassName="dropdown--full-width"
          items={momentTZ.tz.names()}
          selectedKey={scheduleTimezone}
          onChange={(value) => handleOnChangeTimezone(value)}
          menuClassName="ceph-volume-snapshot-modal__dropdown--overflow"
          autocompleteFilter={autocompleteFilter}
        />
      </FormGroup>
      <div className="ceph-volume-snapshot-modal__input--inline">
        {scheduleType === snapshotTypes.Monthly ? <MonthlyElements /> : <WeeklyElements />}
        <FormGroup
          className="ceph-volume-snapshot-modal__input"
          fieldId="snapshot-time"
          label="Time"
        >
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
    </div>
  );

  const ScheduleElements: React.FC = () => (
    <Form>
      {scheduleType === snapshotTypes.CronJob ? <CronElements /> : <OtherElements />}
      <FormGroup
        className="ceph-volume-snapshot-modal__input--grid"
        label="Keep"
        fieldId="snapshot-count"
        helperText="*Older snapshots will be deleted automatically"
        isRequired
      >
        <div className="ceph-volume-snapshot-modal__input--inline">
          <Dropdown
            items={numberOfSnapshot}
            selectedKey={snapshotCount}
            onChange={(value) => setSnapshotCount(Number(value))}
          />
          <span className="ceph-volume-snapshot-modal__span">last snapshots</span>
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
    <Form onSubmit={submit} className="modal-content modal-content--no-inner-scroll">
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
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  pvcData?: FirehoseResourcesResult;
  resource?: K8sResourceKind;
} & ModalComponentProps;

const VolumeSnapshotModalWithFireHose: React.FC<VolumeSnapshotModalWithFireHoseProps> = (props) => (
  <Firehose
    resources={[
      {
        kind: props.kind || PersistentVolumeClaimModel.kind,
        prop: 'pvcData',
        namespace: props?.resource?.metadata?.namespace || props.namespace,
        isList: false,
        name: props?.resource?.metadata?.name || props.name,
      },
    ]}
  >
    <VolumeSnapshotModal {...props} />
  </Firehose>
);

export const volumeSnapshotModal = createModalLauncher(VolumeSnapshotModalWithFireHose);
