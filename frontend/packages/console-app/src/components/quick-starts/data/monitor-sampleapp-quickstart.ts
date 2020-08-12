export const monitorSampleAppQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'monitor-sampleapp',
  },
  spec: {
    version: 4.7,
    displayName: 'Monitoring your sample application',
    duration: 10,
    iconURL: '',
    description: `Now that you’ve created a sample application and added Health Checks, let’s monitor your app`,
    prerequisites: `You should have just created a sample application and added Health Checks to it. If you haven’t done either step, follow the instructions in the **Create a sample application** and/or **Add Health Checks to your sample application** quick starts.

If you have an existing application to monitor, you can follow this procedure using that app instead.`,
    introduction: `### This quick start shows you how to monitor your sample application.`,
    tasks: [
      {
        title: `Viewing the monitoring details of your sample application`,
        description: `### To view the details of your sample application:
1. Go to the project your sample application was created.
2. In the **</> Developer perspective**, go to **Topology**.
3. Click on the **nodejs-sample** deployment to view its details.
4. Click on the **Monitoring** tab of the side panel.

You can see context sensitive metrics and alerts in the Monitoring tab.`,
        review: {
          instructions: `#### To verify you can view the monitoring information:
1. Do you see a **Metrics** accordion in the side panel?
2. Do you see a **View monitoring dashboard** link in the Metrics accordion?
3. Do you see three charts in the **Metrics** accordion: **CPU Usage**, **Memory Usage** and **Receive Bandwidth**?`,
          taskHelp: `Try walking through the steps again`,
        },
        recapitulation: {
          success: `You've learned how you can monitor your sample app!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Viewing your project monitoring dashboard`,
        description: `### To view the project monitoring dashboard in context of **nodejs-sample**:
1. Click on the **View monitoring dashboard** link in the side panel.
2. You can change the **Time Range** and **Refresh Interval** of the dashboard.
3. You can change the context of the dashboard as well by clicking on the dropdown. Select a specific workload or **All Workloads** to view the dashboard in context of the entire project.`,
        review: {
          instructions: `#### To verify that you are able to view the monitoring dashboard:
Do you see eight metrics charts in the dashboard?`,
          taskHelp: `Try walking through the steps again`,
        },
        recapitulation: {
          success: `You've learned how to view the dashboard in context of your sample app!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Viewing custom metrics`,
        description: `### To view custom metrics:
1. Click on the **Metrics** tab of the Monitoring page.
2. Click on the dropdown which says **Select Query** to see the available queries.
3. Click on **Filesystem Usage** from the list to view run the query.`,
        review: {
          instructions: `#### Verify you can see the chart associated with the query:
Do you see a chart displayed with filesystem usage for your project?  Note: select **Custom Query** from the dropdown to create and run a custom query utilizing PromQL.
`,
          taskHelp: `Try walking through the steps again.`,
        },
        recapitulation: {
          success: `You've learned how to run a query!`,
          failed: `Try the steps again.`,
        },
      },
    ],
    conclusion: `You've learned how to access workload monitoring and metrics!`,

    nextQuickStart: ``,
  },
};
