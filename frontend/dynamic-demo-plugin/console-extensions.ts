import {
  ConsoleExtensions,
  codeRef,
} from '@console/dynamic-plugin-sdk/src/extension-providers/provider-types';
import { testHandler } from './src/utils/bar';
import { eventListener } from './src/utils/telemetry';

const exampleFlag = 'EXAMPLE';

const extensions: ConsoleExtensions = [
  {
    type: 'console.flag',
    properties: {
      handler: codeRef(testHandler),
    },
  },
  {
    type: 'console.flag/model',
    properties: {
      flag: exampleFlag,
      model: { group: 'foo.com', version: 'v1', kind: 'Example' },
    },
  },
  {
    type: 'console.telemetry/listener',
    properties: {
      listener: codeRef(eventListener),
    },
  },
];

export default extensions;
