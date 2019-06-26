import * as _ from 'lodash';

export const getPropsData = (data) => _.get(data, 'data.result[0].value[1]', null);
