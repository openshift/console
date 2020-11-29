import { explorePipelinesQuickStart } from './mocks/json/explore-pipeline-quickstart';
import { exploreServerlessQuickStart } from './mocks/json/explore-serverless-quickstart';
import { monitorSampleAppQuickStart } from './mocks/json/monitor-sampleapp-quickstart';
import { QuickStart } from '../utils/quick-start-types';
import { ocsConfigurationQuickStart } from './mocks/json/configuring-ocs-quickstart';

export const allQuickStarts: QuickStart[] = [
  explorePipelinesQuickStart,
  exploreServerlessQuickStart,
  monitorSampleAppQuickStart,
  ocsConfigurationQuickStart,
];
