/* eslint-disable no-unused-vars */

import { Editor, IEditSession, Position } from 'brace';

import { getCompletions } from '../../../public/module/k8s/autocomplete';
import * as k8sResource from '../../../public/module/k8s/resource';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';

describe('getCompletions', () => {
  let editorMock: Editor;
  let sessionMock: IEditSession;
  let position: Position;

  beforeEach(() => {
    sessionMock = Object.assign({} as IEditSession, {
      getLine: jasmine.createSpy('getLineSpy').and.returnValue(''),
      getLines: jasmine.createSpy('getLinesSpy').and.returnValue(['']),
      getLength: jasmine.createSpy('getLengthSpy').and.returnValue(10),
    });
    position = {row: 0, column: 0};
  });

  it('invokes callback with appropriate completions for property values which are defined in k8s API spec', (done) => {
    sessionMock.getLine = jasmine.createSpy('getLineSpy').and.returnValue('terminationMessagePath: ');
    position = {row: 0, column: 'terminationMessagePath: '.length};

    getCompletions(editorMock, sessionMock, position, '', (error, results) => {
      expect(results.length).toBeGreaterThan(0);
      done();
    });
  });

  it('invokes callback with appropriate completions for property values which are retrieved from cluster state', (done) => {
    sessionMock.getLine = jasmine.createSpy('getLineSpy').and.returnValue('serviceName: ');
    position = {row: 0, column: 'serviceName: '.length};
    spyOn(k8sResource, 'k8sListPartialMetadata').and.returnValue(Promise.resolve([testResourceInstance]));

    getCompletions(editorMock, sessionMock, position, '', (error, results) => {
      expect(results.length).toEqual(1);
      expect(results[0]).toEqual({
        name: testResourceInstance.metadata.name,
        score: 10000,
        value: testResourceInstance.metadata.name,
        meta: 'Service',
      });
      done();
    });
  });

  it('invokes callback with appropriate completions for property values in a list which are retrieved from cluster state', (done) => {
    sessionMock.getLine = jasmine.createSpy('getLineSpy').and.callFake((row) => {
      switch (row) {
        case position.row:
          return '  - name: ';
        case position.row - 1:
          return 'imagePullSecrets: ';
        default:
          return '';
      }
    });
    position = {row: 1, column: '  - name: '.length};
    spyOn(k8sResource, 'k8sListPartialMetadata').and.returnValue(Promise.resolve([testResourceInstance]));

    getCompletions(editorMock, sessionMock, position, '', (error, results) => {
      expect(results.length).toEqual(1);
      expect(results[0]).toEqual({
        name: testResourceInstance.metadata.name,
        score: 10000,
        value: testResourceInstance.metadata.name,
        meta: 'Secret',
      });
      done();
    });
  });

  it('does not invoke callback with completions if no matches for property values', (done) => {
    sessionMock.getLine = jasmine.createSpy('getLineSpy').and.returnValue('apiVersion: ');
    position = {row: 0, column: 'apiVersion: '.length};

    getCompletions(editorMock, sessionMock, position, '', () => {
      fail('Should not be called');
      done();
    });
    done();
  });

  it('invokes callback with appropriate completions for properties', (done) => {
    const swagger = {
      definitions: {
        'io.k8s.api.apps.v1.Deployment': {},
        'io.k8s.api.apps.v1.DeploymentSpec': {
          properties: {
            minReadySeconds: {
              description: 'Dummy property',
              type: 'integer',
              format: 'int32'
            }
          }
        }
      }
    };
    sessionMock.getLines = jasmine.createSpy('getLinesSpy').and.returnValue(['kind: Deployment', 'apiVersion: apps/v1']);
    spyOn(window.localStorage, 'getItem').and.returnValue(JSON.stringify(swagger));

    getCompletions(editorMock, sessionMock, position, '', (error, results) => {
      expect(results.length).toEqual(1);
      expect(results[0]).toEqual({
        name: 'minReadySeconds',
        score: 10000,
        value: 'minReadySeconds',
        meta: 'Deployment',
      });
      done();
    });
  });

  it('does not provide completion for properties if k8s API spec cannot be retrieved', (done) => {
    sessionMock.getLines = jasmine.createSpy('getLinesSpy').and.returnValue(['kind: Deployment', 'apiVersion: apps/v1']);
    spyOn(window.localStorage, 'getItem').and.returnValue(null);

    getCompletions(editorMock, sessionMock, position, '', (error, results) => {
      fail('Should not have been called');
    });
    setTimeout(done, 10);
  });
});
