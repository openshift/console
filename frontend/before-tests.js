/* eslint-env node */

import { configure } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import 'url-search-params-polyfill';

// http://airbnb.io/enzyme/docs/installation/index.html#working-with-react-16
configure({ adapter: new Adapter() });
