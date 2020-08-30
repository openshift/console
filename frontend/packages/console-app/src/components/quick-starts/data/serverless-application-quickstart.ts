import { serverlessIcon } from './tour-icons';

export const serverlessApplicationQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'serverless-application',
  },
  spec: {
    version: 4.7,
    displayName: `Exploring Serverless applications`,
    duration: 15,
    iconURL: serverlessIcon,
    description: `Learn how to create a Serverless application.`,
    prerequisites: '',
    introduction: `This quick start guides you through creating and using a serverless application.`,
    tasks: [
      {
        title: `Creating a serverless application`,
        description: `### To create a serverless application:
1. From the **developer** perspective, in the navigation menu, click [+Add](/add).
2. At the top of the page, in the **Projects** list, select a project to create the application in.
3. Click **From Git**.
4. In the **Git Repo URL** field, type \`https://github.com/sclorg/django-ex.git\`.
5. Under Resources, select **Knative Service**.
6. At the end of the page, click **Create**.

The **Topology** view displays your new Serverless application. The application is represented by the light gray area with the white border. The Knative Service is the darker gray area with the dotted border. The Pod ring in the middle represents the revision.`,
        review: {
          instructions: `#### To verify the application was successfully created:
From the **Topology** view, look for your new application. Wait for the build to complete. It may take a few minutes.

After the build completes, a green checkmark appears in the lower-left corner of the service. Your application will say  “No Revisions” in the center.

Do you see the completed application and build?`,
          taskHelp: `This task isn’t verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/serverless/serving-creating-managing-apps.html#creating-serverless-applications-using-the-openshift-container-platform-web-console) about this topic.`,
        },
        recapitulation: {
          success: `You just created a Serverless app!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Demoing scalability`,
        description: `### To see your application scale:
1. From the **Display Options** list at the top of the **Topology** view, click **Pod Count**.
2. Wait for the Pod count to scale down to zero Pods. Scaling down may take a few minutes.
3. Click the **Route URL** icon in the upper-right corner of the Knative Service panel. The application opens in a new tab.
4. Close the new browser tab and return to the **Topology** view.

In the **Topology** view, you can see that your application scaled up to one Pod to accommodate your request.  After a few minutes, your application scales back down to zero Pods.
`,
        review: {
          instructions: `#### To verify the application scaled down:
1. Click the revision inside your service. The badges under the Pod ring and at the top of the side panel should be (REV).
2. Click the **Details** tab in the side panel.

Is the Pod ring autoscaled to zero?`,
          taskHelp: `This task isn’t verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/applications/application_life_cycle_management/odc-viewing-application-composition-using-topology-view.html#odc-scaling-application-pods-and-checking-builds-and-routes_viewing-application-composition-using-topology-view) about this topic.`,
        },
        recapitulation: {
          success: `You just scaled up your application to accomodate a traffic request!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Connecting an event source to your Knative Service`,
        description: `### To connect an event source to your Knative Service:
1. On the **Topology** View, hover over your service with your cursor. You should see a blue arrow.
2. Click and drag the blue arrow, then drop it anywhere outside the service.
3. In the dropdown menu that appears, click **Event Source**.
4. Under the **Type** field, click **PingSource**.
5. In the **Data** field, type \`This message is from PingSource\`. This message is posted when the service is called.
6. In the **Schedule** field, type \`* * * * *\`.  This means that the PingSource will make a call every minute.
7. In the **Application** field, select **Sample Serverless App**.
8. Click **Create**.`,
        review: {
          instructions: `#### To verify that the event connected to your Knative service:

Go to the **Topology** view.

Do you see a PingSource connected by a gray line to the side of your application?`,
          taskHelp: `This task isn’t verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/serverless/event_sources/knative-event-sources.html) about this topic.`,
        },
        recapitulation: {
          success: `You just wired an Event Source to your Knative Service!`,
          failed: `Try the steps again.`,
        },
      },

      {
        title: `Forcing a new revision and set traffic distribution`,
        description: `### To force a revision and set traffic distribution:

1. In **Topology**, click on the revision inside your service to view its details. The badges under the Pod ring and at the top of the detail panel should be (REV).
2. In the side panel, click on the **Resources** tab.
3. Scroll down and click on the configuration associated with your service.
4. Go to the resource’s **YAML** tab.
5. Scroll all the way down until you see \`timeoutSeconds\`.
6. Change the value from \`300\` to \`30\` and click **Save**.
7. Go back to the **Topology** view.
8. Click on your service. The badge at the top of the side panel should be (KSVC).
9. In the side panel, click on the **Resources** tab.
10. Next to **Revisions**, click **Set Traffic Distribution**.
11. Click **Add Revision**.
12. In the **Revision** dropdown, select the new revision.
13. In the **Split** column, set both revisions to **50**.
14. Click **Save**.

You should now be able to watch as the Pod rings for each revision scale up and down each time the application is pinged.`,
        review: {
          instructions: `#### To verify that you forced a new revision and set traffic distribution:

Make sure you are still in **Topology** view.

Do you see two revisions in your Knative Service?`,
          taskHelp: `This task isn’t verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/serverless/knative_serving/splitting-traffic-between-revisions.html) about this topic.`,
        },
        recapitulation: {
          success: `You just set a traffic distribution for your Serverless app!`,
          failed: `Try the steps again.`,
        },
      },

      {
        title: `Deleting your application`,
        description: `### To delete the application you just created:

1. Click your application’s name. The badge at the top of the side panel should be (A).
2. At the top of the resource details panel, click on the **Actions** list.
3. Click **Delete application**.
4. To confirm deletion, type the application’s name in the **Name** field, and then click **Delete**.`,
        review: {
          instructions: `#### To verify you deleted your application:          :

Make sure you are still in **Topology** view.

Has the Sample Serverless App been removed?`,
          taskHelp: `This task is not verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/applications/application_life_cycle_management/odc-deleting-applications.html) about this topic.`,
        },
        recapitulation: {
          success: `You just deleted your Serverless app!`,
          failed: `Try the steps again.`,
        },
      },
    ],
    conclusion: `You just learned how to use Serverless applications in your cluster! To learn more about building Serverless apps, take a look at our [Knative Cookbook](https://redhat-developer-demos.github.io/knative-tutorial/knative-tutorial/index.html).`,

    nextQuickStart: '',
  },
};
