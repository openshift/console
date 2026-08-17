import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '../../models';
import type { ClusterServiceVersionKind } from '../../types';

/**
 * Cancel handler shared by the operand create Form and YAML views so both return the
 * user to the same place: the CSV details page when creating from an initialization
 * resource, otherwise back to wherever the user came from (typically the operator's
 * operand tab).
 *
 * Fixes OCPBUGS-70361: the YAML view previously fell through to EditYAML's generic
 * navigate-to-list behavior, dropping the user onto the generic (non-operator-aware)
 * create page. On retry that page shows an incomplete CR, so steps 3 and 4 of the bug
 * no longer matched. Mirroring the Form view's long-standing cancel behavior keeps the
 * retry on the operand editor.
 */
export const useOperandCancel = (csv: ClusterServiceVersionKind): (() => void) => {
  const navigate = useNavigate();
  return useCallback(() => {
    if (new URLSearchParams(window.location.search).has('useInitializationResource')) {
      navigate(
        resourcePathFromModel(
          ClusterServiceVersionModel,
          csv.metadata.name,
          csv.metadata.namespace,
        ),
        { replace: true },
      );
    } else {
      navigate(-1);
    }
  }, [navigate, csv]);
};
