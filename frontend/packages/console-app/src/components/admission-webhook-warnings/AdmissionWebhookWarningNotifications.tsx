import { useEffect } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import type { Map as ImmutableMap } from 'immutable';
import { useTranslation } from 'react-i18next';
import {
  getAdmissionWebhookWarnings,
  removeAdmissionWebhookWarning,
} from '@console/dynamic-plugin-sdk/src/app/core';
import type { AdmissionWebhookWarning } from '@console/dynamic-plugin-sdk/src/app/redux-types';
import {
  documentationURLs,
  getDocumentationURL,
} from '@console/internal/components/utils/documentation';
import { useToast } from '@console/shared/src/components/toast';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

type UseAdmissionWebhookWarnings = () => ImmutableMap<string, AdmissionWebhookWarning>;
const useAdmissionWebhookWarnings: UseAdmissionWebhookWarnings = () =>
  useConsoleSelector<ImmutableMap<string, AdmissionWebhookWarning>>(getAdmissionWebhookWarnings);

export const AdmissionWebhookWarningNotifications = () => {
  const { t } = useTranslation();
  const toastContext = useToast();
  const dispatch = useConsoleDispatch();
  const admissionWebhookWarnings = useAdmissionWebhookWarnings();
  useEffect(() => {
    const docURL = getDocumentationURL(documentationURLs.admissionWebhookWarning);
    admissionWebhookWarnings.forEach((warning, id) => {
      toastContext.addToast({
        variant: AlertVariant.warning,
        title: t('public~Admission Webhook Warning'),
        content: t(`{{kind}} {{name}} violates policy {{warning}}`, {
          kind: warning?.kind ?? '',
          name: warning?.name ?? '',
          warning: warning?.warning ?? '',
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
