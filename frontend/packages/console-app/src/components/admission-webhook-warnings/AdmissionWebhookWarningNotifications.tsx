import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch, useSelector } from 'react-redux';
import {
  AdmissionWebhookWarning,
  CoreState,
  getAdmissionWebhookWarnings,
  removeAdmissionWebhookWarning,
} from '@console/dynamic-plugin-sdk/src';
import { documentationURLs, getDocumentationURL } from '@console/internal/components/utils';
import { useToast } from '@console/shared/src';

type UseAdmissionWebhookWarnings = () => Map<string, AdmissionWebhookWarning>;
const useAdmissionWebhookWarnings: UseAdmissionWebhookWarnings = () =>
  useSelector<CoreState, Map<string, AdmissionWebhookWarning>>(getAdmissionWebhookWarnings);

export const AdmissionWebhookWarningNotifications = () => {
  const { t } = useTranslation();
  const toastContext = useToast();
  const dispatch = useDispatch();
  const admissionWebhookWarnings = useAdmissionWebhookWarnings();
  React.useEffect(() => {
    const docURL = getDocumentationURL(documentationURLs.admissionWebhookWarning);
    admissionWebhookWarnings.forEach((warning, id) => {
      toastContext.addToast({
        variant: AlertVariant.warning,
        title: t('public~Admission Webhook Warning'),
        content: t(`{{kind}} {{name}} violates policy {{warning}}`, {
          kind: warning.kind,
          name: warning.name,
          warning: warning.warning,
        }),
        actions: [
          {
            dismiss: true,
            label: t('public~Learn more'),
            callback: () => {
              window.open(docURL, '_blank');
            },
            component: 'a',
            dataTest: 'admission-webhook-warning-learn-more',
          },
        ],
        timeout: true,
        dismissible: true,
        dataTest: 'admission-webhook-warning',
      });
      dispatch(removeAdmissionWebhookWarning(id));
    });
  }, [dispatch, admissionWebhookWarnings, t, toastContext]);

  return null;
};
