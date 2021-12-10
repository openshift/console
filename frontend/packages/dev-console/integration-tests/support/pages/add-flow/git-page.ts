import { gitImportRepos } from '../../../testData/git-import/repos';
import { gitAdvancedOptions, buildConfigOptions, builderImages, messages } from '../../constants';
import { gitPO } from '../../pageObjects';
import { app } from '../app';

export const gitPage = {
  unselectRoute: () => cy.get(gitPO.advancedOptions.createRoute).uncheck(),
  verifyNoWorkLoadsText: (text: string) =>
    cy.get(gitPO.noWorkLoadsText).should('contain.text', text),
  verifyPipelinesSection: () => {
    cy.get('.odc-namespaced-page__content').scrollTo('bottom', { ensureScrollable: false });
    cy.get(gitPO.sectionTitle)
      .contains('Pipelines')
      .should('be.visible');
  },
  verifyPipelineInfoMessage: (message: string) => {
    cy.get(gitPO.pipeline.infoMessage).should('contain.text', `Info alert:${message}`);
  },
  enterGitUrl: (gitUrl: string) => {
    const shortUrl = gitUrl.endsWith('.git') ? gitUrl.substring(0, gitUrl.length - 4) : gitUrl;
    const repository = gitImportRepos.find((repo) => repo.url === shortUrl);

    // mock the github requests for the frequently used repositories to avoid rate limits
    if (repository) {
      const urlSegments = repository.url.split('/');
      const organization = urlSegments[urlSegments.length - 2];
      const name = urlSegments[urlSegments.length - 1];
      const apiBaseUrl = `https://api.github.com/repos/${organization}/${name}`;

      cy.readFile(`testData/git-import/${repository.folder}/repo.json`).then((repoResponse) => {
        cy.intercept('GET', apiBaseUrl, {
          statusCode: 200,
          body: repoResponse,
        }).as('getRepo');
      });

      cy.readFile(`testData/git-import/${repository.folder}/contents.json`).then(
        (contentsResponse) => {
          cy.intercept('GET', `${apiBaseUrl}/contents/`, {
            statusCode: 200,
            body: contentsResponse,
          }).as('getContents');
        },
      );

      cy.task('readFileIfExists', `testData/git-import/${repository.folder}/package.json`).then(
        (packageResponse) => {
          cy.intercept('GET', `${apiBaseUrl}/contents//package.json`, {
            statusCode: packageResponse ? 200 : 404,
            body: packageResponse,
          }).as('getPackage');
        },
      );
    }

    cy.get(gitPO.gitRepoUrl)
      .clear()
      .type(gitUrl);

    if (repository) {
      cy.wait(['@getRepo', '@getContents', '@getPackage']);
    }
    app.waitForDocumentLoad();
  },
  verifyPipelineCheckBox: () => {
    cy.get(gitPO.pipeline.addPipeline)
      .scrollIntoView()
      .should('be.visible');
  },
  selectPipeline: (pipelineName: string) => {
    cy.get(gitPO.pipeline.pipelineDropdown)
      .scrollIntoView()
      .click();
    cy.get(`#${pipelineName}-link`)
      .should('be.visible')
      .click();
  },
  enterAppName: (appName: string) => {
    cy.get('body').then(($body) => {
      if ($body.find('#form-input-application-name-field').length !== 0) {
        cy.get('#form-input-application-name-field')
          .scrollIntoView()
          .clear()
          .should('not.have.value');
        cy.get('#form-input-application-name-field')
          .type(appName)
          .should('have.value', appName);
        cy.log(`Application Name "${appName}" is created`);
      } else if ($body.find('#form-dropdown-application-name-field').length !== 0) {
        cy.get(gitPO.appName).click();
        cy.get('[data-test-id="dropdown-text-filter"]').type(appName);
        cy.get('[role="listbox"]').then(($el) => {
          if ($el.find('li[role="option"]').length === 0) {
            cy.get('[data-test-dropdown-menu="#CREATE_APPLICATION_KEY#"]').click();
            cy.get('#form-input-application-name-field')
              .clear()
              .type(appName)
              .should('have.value', appName);
          } else {
            cy.get(`li #${appName}-link`).click();
            cy.log(`Application Name "${appName}" is selected`);
          }
        });
      }
    });
  },
  verifyAppName: (appName: string) => {
    cy.get(gitPO.appName).then(($el) => {
      if ($el.prop('tagName').includes('button')) {
        cy.get(gitPO.appName)
          .find('span')
          .should('contain.text', appName);
      } else if ($el.prop('tagName').includes('input')) {
        cy.get(gitPO.appName).should('have.value', appName);
      } else {
        cy.log(`App name doesn't contain button or input tags`);
      }
    });
    // cy.get(gitPO.appName).should('have.value', nodeName)
  },
  editAppName: (newAppName: string) => {
    cy.get(gitPO.appName).click();
    cy.get(gitPO.createNewApp)
      .first()
      .click();
    cy.get(gitPO.newAppName)
      .clear()
      .type(newAppName);
  },
  enterComponentName: (name: string) => {
    app.waitForLoad();
    cy.get(gitPO.nodeName)
      .scrollIntoView()
      .invoke('val')
      .should('not.be.empty');
    cy.get(gitPO.nodeName).clear();
    cy.get(gitPO.nodeName)
      .type(name)
      .should('have.value', name);
  },
  enterWorkloadName: (name: string) => {
    cy.get(gitPO.nodeName).clear();
    cy.get(gitPO.nodeName)
      .type(name)
      .should('have.value', name);
  },
  verifyNodeName: (componentName: string) =>
    cy.get(gitPO.nodeName).should('have.value', componentName),
  selectResource: (resource: string = 'deployment') => {
    switch (resource) {
      case 'deployment':
      case 'Deployment':
        cy.get(gitPO.resources.deployment)
          .scrollIntoView()
          .check();
        break;
      case 'deployment config':
      case 'Deployment Config':
      case 'DeploymentConfig':
        cy.get(gitPO.resources.deploymentConfig)
          .scrollIntoView()
          .check();
        break;
      case 'Knative':
      case 'Knative Service':
      case 'Serverless Deployment':
        cy.get(gitPO.resources.knative)
          .scrollIntoView()
          .check();
        break;
      default:
        throw new Error('Resource option is not available');
        break;
    }
    cy.log(`Resource type "${resource}" is selected`);
  },
  selectAdvancedOptions: (opt: gitAdvancedOptions) => {
    switch (opt) {
      case gitAdvancedOptions.Routing:
        cy.byButtonText('Routing').click();
        break;
      case gitAdvancedOptions.BuildConfig:
        cy.byButtonText('Build Configuration').click();
        break;
      case gitAdvancedOptions.Deployment:
        cy.byButtonText('Deployment').click();
        break;
      case gitAdvancedOptions.Scaling:
        cy.byButtonText('Scaling').click();
        break;
      case gitAdvancedOptions.ResourceLimits:
        cy.byButtonText('Resource Limits').click();
        break;
      case gitAdvancedOptions.Labels:
        cy.byButtonText('Labels').click();
        break;
      case gitAdvancedOptions.HealthChecks:
        cy.byButtonText('Health Checks').click();
        break;
      default:
        throw new Error('Advanced option is not available');
        break;
    }
  },
  selectAddPipeline: () =>
    cy
      .get(gitPO.pipeline.addPipeline)
      .scrollIntoView()
      .check(),
  clickCreate: () =>
    cy
      .get(gitPO.create)
      .scrollIntoView()
      .should('be.enabled')
      .click(),
  clickCancel: () =>
    cy
      .get(gitPO.cancel)
      .should('be.enabled')
      .click(),
  selectBuilderImageForGitUrl: (gitUrl: string) => {
    switch (gitUrl) {
      case 'https://github.com/sclorg/dancer-ex.git':
        cy.get(`[data-test="card ${builderImages.Perl}"]`).click();
        cy.log(`Selecting builder image "${builderImages.Perl}" to avoid the git rate limit issue`);
        break;
      case 'https://github.com/sclorg/cakephp-ex.git':
        cy.get(`[data-test="card ${builderImages.PHP}"]`).click();
        cy.log(`Selecting builder image "${builderImages.PHP}" to avoid the git rate limit issue`);
        break;
      case 'https://github.com/sclorg/nginx-ex.git':
        cy.get(`[data-test="card ${builderImages.Nginx}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Nginx}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/httpd-ex.git':
        cy.get(`[data-test="card ${builderImages.Httpd}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Httpd}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git':
        cy.get(`[data-test="card ${builderImages.NETCore}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.NETCore}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/golang-ex.git':
        cy.get(`[data-test="card ${builderImages.Go}"]`).click();
        cy.log(`Selecting builder image "${builderImages.Go}" to avoid the git rate limit issue`);
        break;
      case 'https://github.com/sclorg/ruby-ex.git':
        cy.get(`[data-test="card ${builderImages.Ruby}"]`).click();
        cy.log(`Selecting builder image "${builderImages.Ruby}" to avoid the git rate limit issue`);
        break;
      case 'https://github.com/sclorg/django-ex.git':
        cy.get(`[data-test="card ${builderImages.Python}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Python}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/jboss-openshift/openshift-quickstarts':
        cy.get(`[data-test="card ${builderImages.Java}"]`).click();
        cy.log(`Selecting builder image "${builderImages.Java}" to avoid the git rate limit issue`);
        break;
      case 'https://github.com/sclorg/nodejs-ex.git':
        cy.get(`[data-test="card ${builderImages.NodeJs}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.NodeJs}" to avoid the git rate limit issue`,
        );
        break;
      default:
        cy.log(
          `Unable to find the builder image for git url: ${gitUrl}, so selecting node.js builder by default `,
        );
    }
  },
  verifyValidatedMessage: (gitUrl: string) => {
    cy.get(gitPO.gitSection.validatedMessage)
      .should('not.include.text', 'Validating...')
      .and('not.include.text', messages.addFlow.buildDeployMessage);
    cy.get('body').then(($body) => {
      if ($body.text().includes(messages.addFlow.rateLimitExceeded)) {
        // Remove .git suffix and remove all parts before the last path
        const componentName = gitUrl.replace(/\.git$/, '').replace(/^.*[\\\\/]/, '');
        cy.log(
          `Git Rate limit exceeded for url ${gitUrl}, select builder image and fill component name "${componentName}" based on the URL to continue tests.`,
        );
        gitPage.selectBuilderImageForGitUrl(gitUrl);
        cy.get(gitPO.nodeName).clear();
        cy.get(gitPO.nodeName).type(componentName);
      } else if (
        $body.find('[aria-label="Warning Alert"]').length ||
        $body.text().includes(messages.addFlow.privateGitRepoMessage)
      ) {
        cy.log(`Issue with git url ${gitUrl}, maybe a private repo url. Please check it`);
        gitPage.selectBuilderImageForGitUrl(gitUrl);
      }
    });
  },

  verifyBuilderImageDetectedMessage: () =>
    cy.get(gitPO.builderSection.builderImageDetected).should('be.visible'),
  verifyBuilderImageVersion: () =>
    cy.get(gitPO.builderSection.builderImageVersion).should('be.visible'),
  selectTargetPortForRouting: () => {
    cy.get(gitPO.advancedOptions.routing.targetPort)
      .scrollIntoView()
      .clear()
      .type('8080');
  },
  enterRoutingHostName: (hostName: string) =>
    cy.get(gitPO.advancedOptions.routing.hostname).type(hostName),
  enterRoutingPath: (path: string) => cy.get(gitPO.advancedOptions.routing.path).type(path),
  uncheckBuildConfigOption: (checkBoxName: string | buildConfigOptions) => {
    switch (checkBoxName) {
      case buildConfigOptions.webhookBuildTrigger:
        cy.get(gitPO.advancedOptions.buildConfig.webHookBuildTrigger)
          .should('be.visible')
          .uncheck();
        break;
      case buildConfigOptions.automaticBuildImage:
        cy.get(gitPO.advancedOptions.buildConfig.buildTriggerImage)
          .should('be.visible')
          .uncheck();
        break;
      case buildConfigOptions.launchBuildOnCreatingBuildConfig:
        cy.get(gitPO.advancedOptions.buildConfig.buildTriggerConfigField)
          .should('be.visible')
          .uncheck();
        break;
      default:
        throw new Error(
          `Unable to find the "${checkBoxName}" checkbox in Build Configuration Section`,
        );
    }
  },
  enterBuildConfigEnvName: (envName: string) =>
    cy.get(gitPO.advancedOptions.buildConfig.envName).type(envName),
  enterBuildConfigEnvValue: (envValue: string) =>
    cy.get(gitPO.advancedOptions.buildConfig.envValue).type(envValue),
  verifyDeploymentOptionIsChecked: () => {
    cy.get(gitPO.advancedOptions.deployment.deploymentTriggerImage).should('be.checked');
  },
  enterDeploymentEnvName: (envName: string) =>
    cy.get(gitPO.advancedOptions.deployment.envName).type(envName),
  enterDeploymentEnvValue: (envValue: string) =>
    cy.get(gitPO.advancedOptions.deployment.envValue).type(envValue),
  enterResourceLimitCPURequest: (cpuRequestValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.cpuRequest).type(cpuRequestValue),
  enterResourceLimitCPULimit: (cpuLimitValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.cpuLimit).type(cpuLimitValue),
  enterResourceLimitMemoryRequest: (memoryRequestValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.memoryRequest).type(memoryRequestValue),
  enterResourceLimitMemoryLimit: (memoryLimitValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.memoryLimit).type(memoryLimitValue),
  enterScalingReplicaCount: (replicaCount: string) =>
    cy.get(gitPO.advancedOptions.scaling.replicaCount).type(replicaCount),
  enterLabels: (labelName: string) => cy.get(gitPO.advancedOptions.labels).type(labelName),
};
