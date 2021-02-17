import * as _ from 'lodash';
import { checkError } from './utils';

const REQD_KEYS = ['rook-ceph-mon-endpoints'];
const ENCODED_KEYS = ['rook-csi-cephfs-node'];
const JSON_CORRECT = [
  {
    kind: 'ConfigMap',
    data: { maxMonId: '0', data: 'a=10.106.31.93:6789', mapping: {} },
    name: 'rook-ceph-mon-endpoints',
  },
  {
    kind: 'Secret',
    data: { userKey: 'AQBV66pedfkUIhAAn/tnB0cvIih5n9DwwxOwBg==', userID: 'csi-cephfs-node' },
    name: 'rook-csi-cephfs-node',
  },
];
const JSON_CORRECT_MULTIPLE_KEYNAME_VARIATION = [
  {
    kind: 'ConfigMap',
    data: { maxMonId: '0', data: 'a=10.106.31.93:6789', mapping: {} },
    name: 'rook-ceph-mon-endpoints',
  },
  {
    kind: 'Secret',
    data: { userKey: 'AQBV66pedfkUIhAAn/tnB0cvIih5n9DwwxOwBg==', userID: 'csi-cephfs-node' },
    name: 'rook-csi-cephfs-node',
  },
  {
    kind: 'Secret',
    data: { adminKey: 'AQBV66pedfkUIhAAn/tnB0cvIih5n9DwwxOwBg==', userID: 'csi-cephfs-node' },
    name: 'rook-csi-cephfs-provisioner',
  },
];
const JSON_IPV6_VARIATION = [
  {
    kind: 'ConfigMap',
    data: { maxMonId: '0', data: 'a=10:106:31:93:6789', mapping: {} },
    name: 'rook-ceph-mon-endpoints',
  },
  {
    kind: 'Secret',
    data: { userKey: 'AQBV66pedfkUIhAAn/tnB0cvIih5n9DwwxOwBg==', userID: 'csi-cephfs-node' },
    name: 'rook-csi-cephfs-node',
  },
];
const JSON_EMPTY = [
  { kind: 'ConfigMap', data: {}, name: 'rook-ceph-mon-endpoints' },
  { kind: 'Secret', data: {}, name: 'rook-csi-cephfs-node' },
  { kind: 'StorageClass', name: 'rook-ceph-retain-bucket' },
];

const JSON_MALFORMED = [
  {
    kind: 'ConfigMap',
    data: { maxMonId: '0', data: 'a=10.106.31.93:6789', mapping: {} },
    name: 'rook-ceph-mon-endpoints',
  },
  {
    kind: 'Secret',
    data: { userKey: 'AQBV66pedfkUIhAAn/tnB0cvIih5n9DwwxOwBg=!=', userID: 'csi-cephfs-node' },
    name: 'rook-csi-cephfs-node',
  },
];

describe('Verify the data validator is working as expected', () => {
  it('Gives no error when JSON is correct', () => {
    const error = checkError(JSON.stringify(JSON_CORRECT), REQD_KEYS, ENCODED_KEYS);
    expect(error).toBe('');
  });

  it('Gives name of keys when JSON is missing keys', () => {
    const error = checkError(
      JSON.stringify(JSON_CORRECT),
      _.concat(REQD_KEYS, 'random_key'),
      ENCODED_KEYS,
    );
    expect(error.includes('random_key')).toBe(true);
  });

  it('Gives name of keys whose data is empty', () => {
    const error = checkError(JSON.stringify(JSON_EMPTY), REQD_KEYS, ENCODED_KEYS);
    expect(error.includes('rook-ceph-mon-endpoints')).toBe(true);
    expect(error.includes('rook-csi-cephfs-node')).toBe(true);
    expect(error.includes('rook-ceph-retain-bucket')).toBe(true);
  });

  it('Gives name of keys whose keys are malformed Base64 values', () => {
    const error = checkError(JSON.stringify(JSON_MALFORMED), REQD_KEYS, ENCODED_KEYS);
    expect(error.includes('rook-csi-cephfs-node')).toBe(true);
  });

  it('Gives an error regarding IP Family when IP Families do not match', () => {
    const error = checkError(JSON.stringify(JSON_IPV6_VARIATION), REQD_KEYS, ENCODED_KEYS);
    expect(error.includes('The IP Family of the two clusters do not match.')).toBe(true);
  });

  it('Accepts either adminKey or userKey', () => {
    const error = checkError(
      JSON.stringify(JSON_CORRECT_MULTIPLE_KEYNAME_VARIATION),
      [...REQD_KEYS, 'rook-csi-cephfs-provisioner'],
      ENCODED_KEYS,
    );
    expect(error).toBe('');
  });
});
