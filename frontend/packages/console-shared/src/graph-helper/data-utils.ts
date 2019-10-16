import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';
import { getType } from '@console/internal/components/utils/units';

const log = (x: number, y: number) => {
  return Math.log(y) / Math.log(x);
};

const frequentUnit = (dataPoints: DataPoint[], type) => {
  // Reduces the dataset to the most frequently used unit
  const [bestLevel] = dataPoints.reduce(
    (acc, point) => {
      const [maxUnit, maxCount, counts] = acc;
      // Appropriate power level for the datapoint
      const index = Math.floor(log(_.get(type, 'divisor', 1024), point.y));
      const unit = _.get(type, ['units', index], '');
      const unitCount = _.get(counts, unit, 0) + 1;
      return [
        ...(unitCount > maxCount ? [unit, unitCount] : [maxUnit, maxCount]),
        {
          ...counts,
          [unit]: unitCount,
        },
      ];
    },
    ['', 0, {}],
  );
  return bestLevel;
};

// Array based procssor
export const processFrame = (dataPoints: DataPoint[], typeName: string): ProcessFrameResult => {
  const type = getType(typeName);
  let unit = null;
  if (dataPoints) {
    // Get the appropriate unit and convert the dataset to that level
    unit = frequentUnit(dataPoints, type);
    const frameLevel = type.units.indexOf(unit);
    dataPoints.forEach((point) => {
      point.y /= type.divisor ** frameLevel;
    });
  }
  return { processedData: dataPoints, unit };
};

export type ProcessFrameResult = {
  processedData: DataPoint[];
  unit: string;
};

export enum ByteDataTypes {
  BinaryBytes = 'binaryBytes',
  BinaryBytesWithoutB = 'binaryBytesWithoutB',
  DecimalBytes = 'decimalBytes',
  DecimalBytesWithoutB = 'decimalBytesWithoutB',
}
