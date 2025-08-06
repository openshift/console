import * as React from 'react';
import { JSONPath } from 'jsonpath-plus';
import { CRDAdditionalPrinterColumn, K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DASH } from '../../constants';

export const AdditionalPrinterColumnValue: React.FCC<AdditionalPrinterColumnValueProps> = ({
  col,
  obj,
}) => {
  const value = JSONPath({
    path: col.jsonPath.replace(/^\./, ''),
    json: obj,
    wrap: false,
  });

  if (col.type === 'date') {
    return <Timestamp timestamp={value} />;
  }

  switch (typeof value) {
    case 'boolean':
    case 'number':
      return value.toString();
    case 'object':
      if (value === null) {
        return DASH;
      }
      if (col.jsonPath.includes('status.conditions') || col.jsonPath.includes('status.history')) {
        return value;
      }
      return JSON.stringify(value);
    case 'string':
    default:
      return value || DASH;
  }
};

type AdditionalPrinterColumnValueProps = {
  col: CRDAdditionalPrinterColumn;
  obj: K8sResourceKind;
};
