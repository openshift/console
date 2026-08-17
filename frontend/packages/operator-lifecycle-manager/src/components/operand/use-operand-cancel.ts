import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '../../models';
import type { ClusterServiceVersionKind } from '../../types';

/**
 * Cancel handler shared by the operand create Form and YAML views so both return the
 * user to the same place.
 */
export const useOperandCancel = (csv: ClusterServiceVersionKind): (() => void) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return useCallback(() => {
    if (searchParams.has('useInitializationResource')) {
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
  }, [navigate, searchParams, csv]);
};
