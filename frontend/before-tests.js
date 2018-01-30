/* eslint-env node */

import { configure } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

// http://airbnb.io/enzyme/docs/installation/index.html#working-with-react-16
configure({adapter: new Adapter()});

window.SERVER_FLAGS = {
  basePath: '/',
};

require('url-search-params-polyfill');
