export const sampleApplicationQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'sample-application',
  },
  spec: {
    version: 4.7,
    displayName: 'Getting started with a sample',
    duration: 10,
    iconURL: '',
    description: `Is this the first time you’ve used OpenShift? Let's start with a simple sample app to learn the basics.`,
    prerequisites: ``,
    introduction: `### This Quick Start shows you how to deploy a sample application to OpenShift.`,
    tasks: [
      {
        title: `Creating a sample application`,
        description: `### To create a sample application:
1. Using the perspective switcher at the top of the navigation, go to **</> Developer**.
2. Go to the **+Add** page in the navigation.
3. Using the project dropdown, select the project you would like to create the demo application in. You can also create a new one if you’d like.
4. Click **Samples** to create an application from a code sample.
5. Click on the **Node.js** card.
6. Scroll down and click **Create**.

The Topology view will load with your new sample application. The application is represented by the light grey area with the white border. The deployment is a white circle.`,
        review: {
          instructions: `#### To verify the application was successfully created:
1. Do you see a **sample-app** application?
2. Do you see a **nodejs-sample** Deployment?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have created a sample application!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Viewing build status`,
        description: `### To view the build status of the sample application:
1. Hover over the icon on the bottom left quadrant of the **nodejs-sample** deployment to see the build status in a tooltip.
2. Click on the icon for quick access to the build log.

You should be able to see the log stream of the **nodejs-sample-1** build on the **Build Details** page.`,
        review: {
          instructions: `#### To verify the build is complete:
Wait for the build to complete. It may take a few minutes.  Do you see a Completed badge on the page header?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `Your sample app is now built!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Viewing the associated Git repo`,
        description: `### To view the associated code:
1. If you aren't already there, go to the **Topology** page in the navigation.
2. The icon on the bottom right quadrant of the **nodejs-sample** deployment represents the Git repo of the associated code.  The icon shown can be for Bitbucket, GitHub, GitLab or generic Git. Click on it to navigate to the associated Git repository.
`,
        review: {
          instructions: `#### Verify you can see the code associated with the sample app:
Was a new browser tab opened with https://github.com/sclorg/nodejs-ex?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have viewed the associated Git repo.`,
          failed: `Try the steps again.`,
        },
      },

      {
        title: `Viewing the pod status`,
        description: `### To view the pod status:
1. Click on the browser tab with OpenShift.  Notice that the **nodejs-sample** deployment has a pod donut imposed on the circle, representing the pod status
2. Hover over the pod donut.

You should now see the pod status in a tooltip.`,
        review: {
          instructions: `#### To verify you see the pod status:
Do you see the number of associated pods and their statuses?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have viewed the pod status for your app!`,
          failed: `Try the steps again.`,
        },
      },

      {
        title: `Running the sample application`,
        description: `### To run the sample application:
1. The icon on the top right quadrant of the **nodejs-sample** deployment represents the route URL. Click on it to open the URL and run the application.

The application will be run in a new tab.`,
        review: {
          instructions: `#### To verify your sample application is running:
1. Make sure you are in the new tab.
2. Does the page have a **Welcome to your Node.js application on OpenShift** title?`,
          taskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        recapitulation: {
          success: `You have run your sample app!`,
          failed: `Try the steps again.`,
        },
      },
    ],
    conclusion: `Your sample application is deployed and ready! To add health checks to your sample app, take the **Adding health checks to your sample application** quick start`,

    nextQuickStart: `add-healthchecks`,
  },
};
