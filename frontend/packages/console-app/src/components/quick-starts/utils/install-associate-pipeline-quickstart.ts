export const installAssociatePipelineQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'Install-app-and-associate-pipeline',
  },
  spec: {
    version: 4.7,
    displayName: `Install an application and associate a pipeline`,
    duration: 10,
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/openshift-pipelines-operator/icon?resourceVersion=openshift-pipelines-operator.dev-preview.openshift-pipelines-operator.v0.10.7',
    description:
      'Install an application, associate a pipeline, start the pipeline and explore the pipeline run',
    prerequisites: 'OpenShift® Pipelines Operator must be installed',
    introduction:
      '### In this tour you will complete 3 tasks:\n  1. Create an application from Git \n  2. Explore your application\n  3. Explore your Pipeline Run',
    tasks: [
      {
        title: 'Create an application from Git',
        description:
          '### Follow these steps to create an application.\n  1. In the </> Developer perspective, go to the +Add pag\n  2. Create a new project\n  3. Click Import from Git to create an application, specifying https://github.com/sclorg/django-ex.git as the Git Repo URL.\n  4. In the Pipelines section, click the checkbox to add a pipeline to your application.\n  5. Click Create when you’re done.',
        review: {
          instructions:
            '### To verify that your application was successfully created:\n  1. Momentarily, you should be brought to the Topology view\n\n  Is there an Application and Deployment name django-ex?',
          taskHelp: 'Try walking through the steps again to properly create your application.',
        },
        recapitulation: {
          success:
            "You've just installed a deployment with an assocated pipeline! Next, we'll explore your application in topology.",
          failed:
            'Check your work to make sure that the application and deployment are successfully created.',
        },
      },
      {
        title: `Explore your application`,
        description:
          "### Let's explore your application in topology:\n  1. Click on the deployment to see associated details in the side panel.\n  2. Click on the Resources tab in the side panel to view related resources.",
        review: {
          instructions:
            '### To verify that the application has been created an a pipeline was associated:\n  1. The Resources tab of the side panel shows many associated resources including Pods, Pipeline Runs and Routes.\n  2. The Pipeline Runs section displays the associated pipeline.\n\n Is there a Pipeline named django-ex-git?',
          taskHelp:
            'Try walking through the steps again to find associated resources and locate the pipeline',
        },
        recapitulation: {
          success:
            "You've just located the associated Pipeline! Next, we'll start and explore your Pipeline.",
          failed: 'Check your work to locate the associated pipeline.',
        },
      },
      {
        title: `Start and explore your pipeline run`,
        description:
          '### You’ve just explored the topology of your application and seen it’s related resources.  Now let’s start your pipeline.​\n\n  Notice the Pipeline Runs section of the Side Panel\n  1. The first row shows the Pipeline associated with the application and an action button to Start Last Run, which is disabled\n  2. Click on the Pipeline link, which should bring you to the Pipeline Details page\n  3. From the Action menu, click on Start to Start your Pipeline',
        review: {
          instructions:
            '### Momentarily, you should be brought to the Pipeline Run details page.  To verify that your pipeline has started,\n  1. Note that the Pipeline Runs Details section shows a visualization of the pipeline run status.\n  2. The pills in the visualization represent the tasks in the pipeline.\n  3. Hovering over a task will show a popover with the details of the associated steps.\n  4. Click on the Logs tab to watch the progress of your pipeline run.\n  5. When the pipeline run is complete, you will see a Succeeded badge on the page title.​\n\n  Is the status Succeeded?',
          taskHelp: `Try walking through the steps again to properly start your pipeline`,
        },
        recapitulation: {
          success: "You've just run your pipeline successfully",
          failed: 'Check your work to make sure that the pipeline is propertly started',
        },
      },
    ],
    conclusion:
      "You've just created an application and associated a pipeline with it, and successfully started the pipeline.",
    nextQuickStart: ``,
  },
};
