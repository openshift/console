import { serverlessIcon } from './tour-icons';

export const exploreServerlessQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'explore-serverless',
  },
  spec: {
    version: 4.7,
    displayName: `Getting started with Serverless`,
    duration: 10,
    iconURL: serverlessIcon,
    description:
      'Install the Serverless Operator to enable containers, microservices and functions to run "serverless"',
    prerequisites: 'Release requirements if any Install X number of resources',
    introduction: `Red Hat® OpenShift® Serverless enables you to run stateless, serverless workloads on one multi-cloud container platform.

Serverless reduces the needs to manage infrastructure or perform back-end development. Application scaling is automated. Choosing Serverless means simplicity, portability, and efficiency.

Adding Serverless to your OpenShift cluster is quick and easy. This guided tour walks you through the process in just a few minutes.`,
    tasks: [
      {
        title: `Install Serverless Operator`,
        description: `### To install the Serverless Operator:
1. Go to the OperatorHub from the Operators section of the navigation.
2. Use the filter at the top of the page to search for the **OpenShift Serverless Operator**.
3. Click on the tile to open the Operator details.
4. At the top of the side panel, click **Install**.
5. Fill out the Operator Subscription form and click Install. You can leave all of the prefilled options if you&#39;d like.
6. After a few minutes, the OpenShift Serverless Operator should appear in your Installed Operators list.
1. Wait for the Operator to completely install. When prompted, click View Operator to view the OpenShift Serverless Operator details.
7. Click it to see its details.
`,

        review: {
          instructions: `#### To verify that the Serverless Operator was successfully installed:
1. Go to the Installed Operators page from the Operators section of the navigation.
2. Find OpenShift Serverless Operator in the list.
3. Find the Status column and check the status of the OpenShift Serverless Operator.`,
          taskHelp: 'Try walking through the steps again to properly install Serverless Operator',
        },

        recapitulation: {
          success:
            "You've just installed the Serverless Operator! Next, we'll install the required CR's for this Operator to run.",
          failed: 'Check your work to make sure that ',
        },
      },
      {
        title: `Create the knative-serving and knative-eventing APIs`,
        description: `### To create the knative-serving and knative-eventing APIs:
1. Make sure you’re still on the Installed Operators page on the Details tab.
2. Click OpenShift Serverless Operator.
3. Click on the Knative Serving tile to create an instance of the API.
4. Click Create.\n  5. Click on the Details tab of the OpenShift Serverless Operator.
5. Click on the Knative Eventing tile to create an instance of the API.
6. Click Create`,
        review: {
          instructions: `#### To verify that the knative-serving API was installed successfully:
1. Make sure that you are on the Knative Serving tab of the OpenShift Serverless Operator.
2. Is there a knative-serving resource in the list?`,
          taskHelp: `Try walking through the steps again to properly create an instance of knative-eventing`,
        },
        recapitulation: {
          success:
            "You've just created an instance of knative-serving! Next, we'll create an instance of knative-eventing",
          failed:
            'Check your work to make sure that the instance of knative-eventing is properly created',
        },
      },
    ],
    conclusion:
      'Your Serverless Operator is ready! If you want to learn how to deploy a serverless application, take the Serverless Application tour.',
    nextQuickStart: 'serverless-application',
  },
};
