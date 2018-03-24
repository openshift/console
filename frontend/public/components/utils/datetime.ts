import * as moment from 'moment';

export const fromNow = dateTime => moment(dateTime).fromNow();

export const isValid = dateTime => dateTime instanceof Date && !Number.isNaN(dateTime.valueOf());

// Calling dateTime.utc() modifies dateTime to be UTC. :(
// eslint-disable-next-line import/namespace
export const utc = dateTime => moment.utc(dateTime);

export const format = (dateTime, fmt) => moment(dateTime).format(fmt);
