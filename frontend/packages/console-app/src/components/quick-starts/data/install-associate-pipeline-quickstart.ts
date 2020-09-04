import { pipelineIcon } from './tour-icons';

export const installAssociatePipelineQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'install-app-and-associate-pipeline',
  },
  spec: {
    version: 4.7,
    displayName: `Deploying an application with a pipeline`,
    duration: 10,
    iconURL: pipelineIcon,
    description: `Import an application from Git, add a pipeline to it, and run the Pipeline.`,
    prerequisites: '',
    introduction: `This quick start guides you through creating an application and associating it with a CI/CD pipeline.
`,
    tasks: [
      {
        title: `Importing an application and associate it with a pipeline`,
        description: `### Follow these steps to create an application.
1. From the **Developer** perspective, in the navigation menu, click **+Add**.
2. At the top of the page, in the Projects list, select a project or create a new project to put the application in.
3. Click **From Git**.
4. In the **Git Repo URL** field, enter \`https://github.com/sclorg/django-ex.git\`.
4. In the **Pipelines** section, click the checkbox to add a pipeline to your application.
5. Click **Create** when you’re done.`,
        review: {
          instructions: `#### To verify that your application was successfully created:
Momentarily, you should be brought to the **Topology** view.

Is there an Application and Deployment name \`django-ex?\``,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You just installed a deployment with an associated pipeline! Next, we'll explore your application in topology.`,
          failed: `Check your work to make sure that the application and deployment are successfully created.`,
        },
      },
      {
        title: `Exploring your application`,
        description: `### Let's explore your application in topology:
1. Click on the deployment to see associated details in the side panel.
2. Click on the Resources tab in the side panel to view related resources.`,
        review: {
          instructions: `#### To verify that the application has been created and a pipeline was associated:
1. The **Resources** tab of the side panel shows many associated resources, including **Pods**, **Pipeline Runs**, and **Routes**.
2. The **Pipeline Runs** section displays the associated pipeline.

Is there a Pipeline named django-ex-git?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You just located the associated Pipeline! Next, we'll start and explore your Pipeline.`,
          failed: `Check your work to locate the associated pipeline.`,
        },
      },
      {
        title: `Starting your pipeline`,
        description: `### You’ve just explored the topology of your application and seen it’s related resources.  Now let’s start your pipeline.
Notice the Pipeline Runs section of the Side Panel
1. The first row shows the Pipeline associated with the application and an action button to **Start Last Run**, which is disabled.
2. Click on the Pipeline link, which should bring you to the **Pipeline Details** page.
3. From the Action menu, click on **Start** to start your Pipeline.`,
        review: {
          instructions: `#### Momentarily, you should be brought to the **Pipeline Run Details** page. To verify that your pipeline has started,
1. Note that the **Pipeline Runs Details** section shows a visualization of the pipeline run status and the tasks in the pipeline.
2. The pills in the visualization represent the tasks in the pipeline.
3. Hovering over a task shows a tooltip with the details of the associated steps.
4. Click on the **Logs** tab to watch the progress of your pipeline run.
5. When the pipeline run is complete, you will see a Succeeded badge on the page title.

Is the status Succeeded?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have run your pipeline successfully`,
          failed: `This task is not verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/pipelines/working-with-pipelines-using-the-developer-perspective.html#creating-applications-with-openshift-pipelines) about this topic.`,
        },
      },
    ],
    conclusion: `You just created an application and associated a pipeline with it, and successfully started the pipeline.`,
    nextQuickStart: ``,
  },
};
