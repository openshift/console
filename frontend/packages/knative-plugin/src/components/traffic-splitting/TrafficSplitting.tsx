import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { Traffic } from '../../types';
import { getRevisionItems, constructObjForUpdate } from '../../utils/traffic-splitting-utils';
import TrafficSplittingModal from './TrafficSplittingModal';

export interface TrafficSplittingProps {
  service: K8sResourceKind;
  revisions: K8sResourceKind[];
  cancel?: () => void;
  close?: () => void;
}

export interface TrafficSplittingType {
  trafficSplitting: Traffic[];
}

const TrafficSplitting: React.FC<TrafficSplittingProps> = ({
  service,
  revisions,
  cancel,
  close,
}) => {
  const { t } = useTranslation();
  const traffic: Traffic[] = service.spec?.traffic ?? [{ percent: 0, tag: '', revisionName: '' }];
  const latestCreatedRevName = service.status?.latestCreatedRevisionName;
  const revisionItems = getRevisionItems(revisions);
  const initialValues: TrafficSplittingType = {
    trafficSplitting: traffic.reduce((acc: Traffic[], currentValue) => {
      const trafficIndex = acc.findIndex((val) => val.revisionName === currentValue.revisionName);
      if (trafficIndex >= 0) {
        acc[trafficIndex].percent += currentValue.percent;
      } else {
        acc.push({
          percent: currentValue.percent,
          tag: currentValue.tag || '',
          revisionName:
            currentValue.revisionName ||
            (currentValue.latestRevision && latestCreatedRevName ? latestCreatedRevName : ''),
        });
      }
      return acc;
    }, []),
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const obj = constructObjForUpdate(values.trafficSplitting, service);
    return k8sUpdate(ServiceModel, obj)
      .then(() => {
        action.setStatus({ error: '' });
        close();
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({ error: errMessage });
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
