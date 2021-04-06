import { ResolvedExtension, FileUpload } from '@console/dynamic-plugin-sdk';
import { getFileType, getRequiredFileUploadExtension, isFileSupported } from '../file-upload-utils';

describe('file-upload-utils', () => {
  const fileExtensions = ['jar', 'yaml'];
  const handler1 = () => {};
  const handler2 = () => {};
  const fileUploadExtensions: ResolvedExtension<FileUpload>[] = [
    {
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      properties: {
        fileExtensions: ['jar'],
        handler: handler1,
      },
      type: 'console.file-upload',
      uid: '@console/dev-console[47]',
    },
    {
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      properties: {
        fileExtensions: ['zip'],
        handler: handler2,
      },
      type: 'console.file-upload',
      uid: '@console/dev-console[47]',
    },
  ];

  it('should return file extension', () => {
    expect(getFileType('file1.jar')).toBe('jar');
  });

  it('should return null for file name without extension', () => {
    expect(getFileType('file1')).toBe(null);
  });

  it('should return empty string for file name with missing extension', () => {
    expect(getFileType('file2.')).toBe('');
  });

  it('should return true for jar file', () => {
    const file: File = {
      name: 'spring-boot-artifacts.jar',
      type: 'application/x-java-archive',
      lastModified: 15464,
      size: 156575,
      arrayBuffer: undefined,
      slice: undefined,
      stream: undefined,
      text: undefined,
    };
    expect(isFileSupported(file.name, fileExtensions)).toBe(true);
  });

  it('should return true for yaml file', () => {
    const file: File = {
      name: 'sleep-1-minute-pipeline.yaml',
      size: 220,
      type: 'application/x-yaml',
      lastModified: 1610966087983,
      arrayBuffer: undefined,
      slice: undefined,
      stream: undefined,
      text: undefined,
    };
    expect(isFileSupported(file.name, fileExtensions)).toBe(true);
  });

  it('should return true for JAR file', () => {
    const file: File = {
      name: 'spring-boot-artifacts.JAR',
      type: 'application/x-java-archive',
      lastModified: 15464,
      size: 156575,
      arrayBuffer: undefined,
      slice: undefined,
      stream: undefined,
      text: undefined,
    };
    expect(isFileSupported(file.name, fileExtensions)).toBe(true);
  });

  it('should return false for zip file', () => {
    const file: File = {
      name: 'sleep-1-minute-pipeline.zip',
      size: 220,
      type: 'application/x-zip',
      lastModified: 1610966087983,
      arrayBuffer: undefined,
      slice: undefined,
      stream: undefined,
      text: undefined,
    };
    expect(isFileSupported(file.name, fileExtensions)).toBe(false);
  });

  it('should return false for xyz type file', () => {
    const file: File = {
      name: 'sleep-1-minute-pipeline.jar.xyz',
      size: 220,
      type: 'application/x-jar',
      lastModified: 1610966087983,
      arrayBuffer: undefined,
      slice: undefined,
      stream: undefined,
      text: undefined,
    };
    expect(isFileSupported(file.name, fileExtensions)).toBe(false);
  });

  it('should return false for file with no extension', () => {
    const file: File = {
      name: 'jar',
      size: 220,
      type: '',
      lastModified: 1610966087983,
      arrayBuffer: undefined,
      slice: undefined,
      stream: undefined,
      text: undefined,
    };
    expect(isFileSupported(file.name, fileExtensions)).toBe(false);
  });

  it('should return the file upload handler for supported file type', () => {
    const fileEx = getRequiredFileUploadExtension(fileUploadExtensions, 'string-boot.jar');
    expect(fileEx.properties.handler).toEqual(handler1);
  });

  it('should return null if there is no handler for a file type', () => {
    const fileEx = getRequiredFileUploadExtension(fileUploadExtensions, 'string-boot.yaml');
    expect(fileEx).toEqual(null);
  });
});
