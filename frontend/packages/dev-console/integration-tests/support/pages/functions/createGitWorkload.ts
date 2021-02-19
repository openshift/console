import { addPage } from '../add-flow/add-page';
import { gitPage } from '../add-flow/git-page';
import { addOptions } from '../../constants/add';

export const createGitWorkload = (
  gitUrl: string = 'https://github.com/sclorg/nodejs-ex.git',
  componentName: string = 'nodejs-ex-git',
  resourceType: string = 'Deployment',
  appName: string = 'nodejs-ex-git-app',
  isPipelineSelected: boolean = false,
) => {
  addPage.selectCardFromOptions(addOptions.Git);
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage();
  gitPage.enterAppName(appName);
  gitPage.enterComponentName(componentName);
  gitPage.selectResource(resourceType);
  if (isPipelineSelected === true) {
    gitPage.selectAddPipeline();
  }
  gitPage.clickCreate();
};
