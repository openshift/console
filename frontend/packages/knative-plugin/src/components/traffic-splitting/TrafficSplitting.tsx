import type { FC } from 'react';
import type { FormikValues, FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind, Patch } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import type { Traffic } from '../../types';
import { getRevisionItems, trafficDataForPatch } from '../../utils/traffic-splitting-utils';
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

const TrafficSplitting: FC<TrafficSplittingProps> = ({ service, revisions, cancel, close }) => {
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
    const ksvcPatch: Patch[] = trafficDataForPatch(values.trafficSplitting, service);
    return k8sPatch(ServiceModel, service, ksvcPatch)
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
