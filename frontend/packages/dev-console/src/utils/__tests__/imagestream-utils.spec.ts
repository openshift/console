import {
  getPorts,
  makePortName,
  getImageStreamTags,
  getImageStreamResource,
} from '../imagestream-utils';
import { ImageStreamTagData, sampleImageStreams } from './imagestream-test-data';

describe('Transform image ports to k8s structure', () => {
  it('expect port object to be transformed into k8s structure', () => {
    expect(getPorts(ImageStreamTagData)).toEqual([
      { containerPort: 8080, protocol: 'TCP' },
      { containerPort: 8888, protocol: 'TCP' },
    ]);
  });
});

describe('Transform container port name', () => {
  it('expect port object to be transformed with cli naming convention', () => {
    const ports = getPorts(ImageStreamTagData);
    expect(makePortName(ports[0])).toEqual('8080-tcp');
    expect(makePortName(ports[1])).toEqual('8888-tcp');
  });
});

describe('Transform imagestream data', () => {
  it('expect to have imagestream tags', () => {
    const imgStreamsTags = getImageStreamTags(sampleImageStreams[0]);
    expect(imgStreamsTags).toMatchObject({ latest: 'latest' });
  });

  it('expect to not have imagestream tags', () => {
    const imgStreamsTags = getImageStreamTags({});
    expect(imgStreamsTags).toMatchObject({});
  });

  it('expect to return the resource without namespace', () => {
    const resources = getImageStreamResource('');
    expect(resources).toHaveLength(0);
    expect(resources).toMatchObject([]);
  });

  it('expect to return the resource with namespace', () => {
    const resource = getImageStreamResource('test');
    expect(resource).toHaveLength(1);
    expect(resource[0].namespace).toBe('test');
  });
});
