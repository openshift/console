export const addHealthChecksQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'add-healthchecks',
  },
  spec: {
    version: 4.7,
    displayName: 'Adding health checks to your sample application',
    duration: 10,
    iconURL: '',
    description: `You just created a sample application. Now, let’s add health checks to it.`,
    prerequisites: `You completed the "Getting started with a sample" quick start.`,
    introduction: `### This quick start shows you how to add health checks to your sample application.
You should have previously created the **sample-app** application and **nodejs-sample** deployment via the **Get started with a sample** quick start. If you haven't, you may be able to follow these tasks with any existing deployment without configured health checks.`,
    tasks: [
      {
        title: `Viewing the details of your sample application`,
        description: `### To view the details of your sample application:
1. Go to the project your sample application was created in.
2. In the **</> Developer** perspective, go to **Topology**.
3. Click on the **nodejs-sample** deployment to view its details.

Momentarily, a side panel will be displayed containing the details of your sample application.`,
        review: {
          instructions: `#### To verify you are viewing the details of your sample application:
Is the side panel titled **nodejs-sample**?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have viewed the details of your sample app!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Verifying that there are no health checks`,
        description: `### To verify that there your sample application has no health checks configured:
1. View the information in the **Resources** tab in the side panel.`,
        review: {
          instructions: `#### To verify there are no health checks configured:
Do you see an inline alert stating that **nodejs-sample** does not have health checks?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have verified that there are no existing Health Checks!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Adding Health Checks to your sample`,
        description: `### To add Health Checks to your sample:
1. Add health checks to your **nodejs-sample** deployment in one of the following ways: (a) On the side panel, click on the **Actions** menu, where you will see an Add Health Checks menu item or (b)Click on the **Add Health Checks** link on the inline notification in the side panel.
2. In the Add Health Checks form, click on the **Add Readiness Probe** link.  Leave the default values, and click on the check to add the Readiness Probe.
3. Click on the **Add Liveness Probe** link.  Leave the default values, and click on the check to add the Liveness Probe.
4. Click on the **Add Startup Probe** link.  Leave the default values, and click on the check to add the Startup Probe.
5. Click **Add** when you’re done.

Momentarily, the form will disappear and you will be brought back to Topology, with the side panel displayed.`,
        review: {
          instructions: `#### Verify that health checks are now configured:
Is the inline notification gone?`,
          taskHelp: `This task isn’t verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/applications/application-health.html#odc-adding-health-checks) about this topic.`,
        },
        recapitulation: {
          success: `You have added health checks to your sample app!`,
          failed: `Try the steps again.`,
        },
      },
    ],
    conclusion: `Your sample application now has Health Checks. To ensure that your application is running correctly, take the **Monitor your sample application** quick start.`,

    nextQuickStart: `monitor-sampleapp`,
  },
};
