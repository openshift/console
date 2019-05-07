import * as React from 'react';

import { FLAGS } from '../../const';
import { connectToFlags } from '../../reducers/features';
import { PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH } from '.';

const canAccessPrometheus = (prometheusFlag) => prometheusFlag && !!PROMETHEUS_BASE_PATH && !!PROMETHEUS_TENANCY_BASE_PATH;

// HOC that will hide WrappedComponent when Prometheus isn't configured or the user doesn't have permission to query Prometheus.
// TODO Figure out better typing here
export const requirePrometheus = (WrappedComponent) => connectToFlags<any>(FLAGS.PROMETHEUS)(
  ({ flags, ...rest }) => {
    const prometheusFlag = flags[FLAGS.PROMETHEUS];
    if (!canAccessPrometheus(prometheusFlag)) {
      return null;
    }

    return <WrappedComponent {...rest} />;
  }
);
