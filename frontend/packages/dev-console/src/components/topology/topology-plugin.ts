import { getDevConsoleComponentFactory } from './components/devConsoleComponetFactory';
import { getCreateConnector } from './createConnector';
import { getBindableDevConsoleTopologyDataModel } from './dev-console-data-transformer';

export const componentFactory = getDevConsoleComponentFactory;
export const getDataModel = getBindableDevConsoleTopologyDataModel;
export const createConnector = getCreateConnector;
