import { serverlessIcon } from './tour-icons';

export const serverlessApplicationQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'serverless-application',
  },
  spec: {
    version: 4.7,
    displayName: `Creating a Serverless application`,
    duration: 15,
    iconURL: serverlessIcon,
    description: 'Learn how to create a Serverless application.',
    prerequisites: 'Install the OpenShift® Serverless Operator to start creating Serverless apps.',
    introduction: `### OpenShift Serverless is flexible. With Serverless, you get:

**Scalability**
Your apps scale automatically, increasing containers to handle peak loads and rolling them back at lulls.

**Interoperability**
Serverless gives you access to a rich ecosystem of built-in and third-party event sources, like Kafka, GitHub, and other SaaS solutions.

**Iteration**
Deploying new versions of apps is simple with Serverless. Perform canary, A/B, and blue-green testing with confidence. By using app revisions, you can roll things back, or split traffic between revisions, as needed.

This quick start shows you how to create a Serverless app that realizes these benefits.

In this quick start, you perform five tasks:
1. Create a Serverless application
2. Demo scalability
3. Wire an event source to your Knative Service
4. Force a new revision & set traffic distribution
5. Delete your application`,
    tasks: [
      {
        title: `Create a Serverless application`,
        description: `### Follow these steps to create an Serverless application:
1. Using the perspective switcher at the top of the navigation, go to **</> Developer**.
2. Using the project dropdown, select the project you would like to create the demo application in. You can also create a new one if you’d like.
3. Once there, go to the **+Add** page in the navigation.
3. Click **From Git** to create an application.
4. In the field labeled **Git Repo URL**, copy and paste [https://github.com/sclorg/django-ex.git](https://github.com/sclorg/django-ex.git).
5. In the field labeled Application Name, add the name Sample Serverless App.
6. Under **Resources**, select **Knative Service**.
7. Scroll down and click **Create**.
The Topology view will load with your new Serverless application. The application is represented by the light grey area with the white border. The Knative Service is the darker grey area with the dotted border. The pod donut in the middle represents the revision.`,
        review: {
          instructions: `#### To verify the application was successfully created:
1. From Topology, look for your new application. While the build completes, it will say “No Revisions.”
2. Do you see your application?

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again',
        },
        recapitulation: {
          success: `You've just created a Serverless app!`,
          failed: 'Try the steps again.',
        },
      },
      {
        title: 'Demo scalability',
        description: `### To see your application scale:
1. Wait for the build to complete. It may take a few minutes. You will see a green checkmark in the bottom left corner of the service.
2. From the **Display Options** dropdown at the top of the Topology view, select **Pod Count**.
3. Wait for the Pod Count to scale down to 0 pods. This may take a few minutes.
4. Click the route URL icon in the top right corner of the Knative Service. The application will open in a new tab.
5. Close the new browser tab and go back to the Topology view.

You should be able to see that your application scaled up to 1 Pod to accommodate the traffic request when you accessed the application. After a few minutes, you should see your application scale back down to 0 pods.`,
        review: {
          instructions: `#### To verify the application scaled down:
1. Click on the pod donut inside your service. The badge at the top of the side panel should be (REV).
2. Click on the **Details** tab in the side panel.
3. Is the pod donut autoscaled to 0?

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again',
        },
        recapitulation: {
          success: "You've just scaled up your application to accomodate a traffic request!",
          failed: 'Try the steps again.',
        },
      },
      {
        title: `Wire an event source to your Knative Service`,
        description: `### To wire an event source to your Knative Service:
1. Hover over your service with your mouse. You should see a blue arrow.
2. Click the blue arrow, then drag and drop the **(+)** anywhere outside the service.
3. In the dropdown menu that appears, click **Event Source**.
4. Under the **Type** field, click **PingSource**.
5. In the field labeled **Data**, type “This message is from PingSource.” This is the message that gets posted when the service is called.
6. In the field labeled Schedule, type “* * * * *”. This means that every minute it will make a call.
7. In the Application field, select the application Sample Serverless App.
8. Click Create.`,
        review: {
          instructions: `#### To verify the PingSource was created:
1. Make sure you are still in Topology view.
2. Do you see a PingSource to the right of your application, connected by a grey sink connector line?

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again.',
        },
        recapitulation: {
          success: "You've just wired an Event Source to your Knative Service!",
          failed: 'Try the steps again.',
        },
      },

      {
        title: `Force a new revision & set traffic distribution`,
        description: `### To force a new revision and set traffic distribution:
1. Click on the pod donut inside your service. The badge at the top of the side panel should be (REV).
1. In the side panel, click on the **Resources** tab.
1. Scroll down and click on the configuration associated with your service.
1. Go to the resource’s **YAML** tab.
1. Scroll all the way down until you see timeoutSeconds.
1. Change the value from 300 to 30 and click **Save**.
1. Go back to the **Topology** view.
1. Click on your service. The badge at the top of the side panel should be (KSVC).
1. In the side panel, click on the **Resources** tab.
1. Next to **Revisions**, click **Set Traffic Distribution**.
1. Click **Add Revision**.
1. In the **Revision** dropdown, select the new revision.
1. In the **Split** column, set both revisions to 50.
1. Click **Save**.

You should now be able to watch as the pod donuts for each revision scale up and down each time the application is pinged.`,
        review: {
          instructions: `#### To verify you forced a new revision and set traffic distribution:
1. Make sure you are still in Topology view.
2. Do you see two pod donuts in your Knative Service?

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again.',
        },
        recapitulation: {
          success: "You've just set a traffic distribution for your Serverless app!",
          failed: 'Try the steps again.',
        },
      },

      {
        title: `Delete your application`,
        description: `### To delete the application you just created:
1. Click on your application. The badge at the top of the side panel should be (A).
2. At the top of the side panel, click on the Actions dropdown.
3. Click Delete Application.
4. Confirm deletion by typing the application name in the field and click Delete.

Deleting this application will remove the application and all related resources from your cluster.`,
        review: {
          instructions: `#### To verify you deleted your application:          :
1. Make sure you are still in Topology view.
2. Has the Sample Serverless App been removed?

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again.',
        },
        recapitulation: {
          success: "You've just deleted your Serverless app!",
          failed: 'Try the steps again.',
        },
      },
    ],
    conclusion:
      'You now know how to use Serverless applications in your cluster! If you want to learn how to build more Serverless apps, take a look a our [Knative Cookbook](https://redhat-developer-demos.github.io/knative-tutorial/knative-tutorial/index.html).',

    nextQuickStart: '',
  },
};
