import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';
import { getType } from '@console/internal/components/utils/units';

const log = (x: number, y: number) => {
  return Math.log(y) / Math.log(x);
};

// Get the larget unit seen in the dataframe within the supported range
const bestUnit = (dataPoints: DataPoint[][], type) => {
  const flattenDataPoints = dataPoints.reduce((acc, arr) => acc.concat(arr), []);

  const bestLevel = flattenDataPoints.reduce((maxUnit, point) => {
    const index = Math.floor(log(_.get(type, 'divisor', 1024), point.y));
    const unitIndex = index >= type.units.length ? type.units.length - 1 : index;
    return maxUnit < unitIndex ? unitIndex : maxUnit;
  }, -1);
  return _.get(type, ['units', bestLevel]);
};

// Array based processor
export const processFrame = (dataPoints: DataPoint[][], typeName: string): ProcessFrameResult => {
  const type = getType(typeName);
  let unit = null;
  if (dataPoints && dataPoints[0]) {
    // Get the appropriate unit and convert the dataset to that level
    unit = bestUnit(dataPoints, type);
    const frameLevel = type.units.indexOf(unit);
    dataPoints.forEach((arr) =>
      arr.forEach((point) => {
        point.y /= type.divisor ** frameLevel;
      }),
    );
  }
  return { processedData: dataPoints, unit };
};

export type ProcessFrameResult = {
  processedData: DataPoint[][];
  unit: string;
};

export enum ByteDataTypes {
  BinaryBytes = 'binaryBytes',
  BinaryBytesWithoutB = 'binaryBytesWithoutB',
  DecimalBytes = 'decimalBytes',
  DecimalBytesWithoutB = 'decimalBytesWithoutB',
}
