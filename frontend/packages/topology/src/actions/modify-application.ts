import { useMemo } from 'react';
import i18next from 'i18next';
import { GetModifyApplicationAction } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { useEditApplicationModalLauncher } from '../components/modals/EditApplicationModal';

export const useGetModifyApplicationAction: GetModifyApplicationAction = (
  kind,
  obj,
  insertBefore,
) => {
  const editApplicationModalLauncher = useEditApplicationModalLauncher({
    resourceKind: kind,
    resource: obj,
    blocking: true,
    initialApplication: '',
  });
  return useMemo(
    () => ({
      id: 'modify-application',
      label: i18next.t('topology~Edit application grouping'),
      insertBefore: insertBefore ?? 'edit-pod-count',
      cta: editApplicationModalLauncher,
      accessReview: {
        verb: 'patch',
        group: kind?.apiGroup,
        resource: kind?.plural,
        namespace: obj?.metadata?.namespace,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insertBefore, kind, obj],
  );
};
