import { exploreServerlessQuickStart } from './explore-serverless-quickstart';
import { explorePipelinesQuickStart } from './explore-pipeline-quickstart';
import { installAssociatePipelineQuickStart } from './install-associate-pipeline-quickstart';
import { serverlessApplicationQuickStart } from './serverless-application-quickstart';
import { sampleApplicationQuickStart } from './sample-application-quickstart';
import { addHealthChecksQuickStart } from './add-healthchecks-quickstart';
import { monitorSampleAppQuickStart } from './monitor-sampleapp-quickstart';
import { QuickStart } from '../utils/quick-start-types';

export const allQuickStarts: QuickStart[] = [
  exploreServerlessQuickStart,
  serverlessApplicationQuickStart,
  explorePipelinesQuickStart,
  installAssociatePipelineQuickStart,
  sampleApplicationQuickStart,
  addHealthChecksQuickStart,
  monitorSampleAppQuickStart,
];
