export const addHealthChecksQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'add-healthchecks',
  },
  spec: {
    version: 4.7,
    displayName: 'Adding Health Checks to your sample application',
    duration: 10,
    iconURL: '',
    description: `You just created a sample application. Now, let’s add Health Checks to it.`,
    prerequisites: `You should have just created a sample application. If you haven’t, please follow the instructions on the **Get started with a sample** quick start.

    If you have an existing application to add Health Checks to, you can follow this procedure using that app instead.`,
    introduction: `### This Quick Start shows you how to add Health Checks to your sample application.`,
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
          taskHelp: `Try walking through the steps again`,
        },
        recapitulation: {
          success: `You've just viewed the details of your sample app!`,
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
          taskHelp: `Try walking through the steps again`,
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
          taskHelp: `Try walking through the steps again.`,
        },
        recapitulation: {
          success: `You've just added health checks to your sample app!`,
          failed: `Try the steps again.`,
        },
      },
    ],
    conclusion: `Your sample application now has Health Checks. To ensure that your application is running correctly, take the **Monitor your sample application** quick start.`,

    nextQuickStart: `monitor-sampleapp`,
  },
};
