import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { getRevisionItems, constructObjForUpdate } from '../../utils/traffic-splitting-utils';
import TrafficSplittingModal from './TrafficSplittingModal';

export interface TrafficSplittingProps {
  service: K8sResourceKind;
  revisions: K8sResourceKind[];
  cancel?: () => void;
  close?: () => void;
}

export interface TrafficSplittingType {
  trafficSplitting: {
    percent: number;
    tag: string;
    revisionName: string;
  }[];
}

const TrafficSplitting: React.FC<TrafficSplittingProps> = ({
  service,
  revisions,
  cancel,
  close,
}) => {
  const traffic = _.get(
    service,
    ['status', 'traffic'],
    [{ percent: 0, tag: '', revisionName: '' }],
  );
  const revisionItems = getRevisionItems(revisions);
  const initialValues: TrafficSplittingType = {
    trafficSplitting: traffic.map((t) => ({
      percent: t.percent,
      tag: t.tag || '',
      revisionName: t.revisionName || '',
    })),
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const obj = constructObjForUpdate(values.trafficSplitting, service);
    k8sUpdate(ServiceModel, obj)
      .then(() => {
        action.setSubmitting(false);
        action.setStatus({ error: '' });
        close();
      })
      .catch((err) => {
        action.setStatus({ error: err.message || 'An error occurred. Please try again' });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
    >
      {(formikProps) => (
        <TrafficSplittingModal {...formikProps} cancel={cancel} revisionItems={revisionItems} />
      )}
    </Formik>
  );
};
export default TrafficSplitting;
