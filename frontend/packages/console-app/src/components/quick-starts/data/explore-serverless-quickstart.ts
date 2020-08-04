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
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/serverless-operator/icon?resourceVersion=serverless-operator.4.3.serverless-operator.v1.7.2',
    description:
      'Install the Serverless Operator to enable containers, microservices and functions to run "serverless"',
    prerequisites: 'Release requirements if any Install X number of resources',
    introduction: `Red Hat® OpenShift® Serverless enables you to run stateless, serverless workloads on one multi-cloud container platform.

Serverless reduces the needs to manage infrastructure or perform back-end development. Application scaling is automated. Choosing Serverless means simplicity, portability, and efficiency.

Adding Serverless to your OpenShift cluster is quick and easy. This guided tour walks you through the process in just a few minutes.`,
    tasks: [
      {
        title: `Install the Serverless Operator`,
        description: `### To install the Serverless Operator:
1. In the navigation panel, click **Operators > OperatorHub**.
2. In the filter field, type `OpenShift Serverless Operator`.
3. Click the **OpenShift Serverless Operator** tile.
4. Click **Install**.
5. Complete the Operator subscription form, and then click **Install**. The default requirements suffice for most installations.
6. On the "Installed Operators" page, wait for the OpenShift Serverless Operator's status to change from Installing to Succeeded.
7. In the Name column, click **OpenShift Serverless Operator** to view the Operator's details.
`,

        review: {
          instructions: `#### To verify that the Serverless Operator was successfully installed:
1. In the navigation panel, click **Operators > Installed Operators**.
2. Find OpenShift Serverless Operator in the list.
3. Find the Status column, and then verify that the status of the OpenShift Serverless Operator is Succeeded.`,
          taskHelp: 'Restart the tour from the beginning.',
        },

        recapitulation: {
          success:
            "You just installed the Serverless Operator! Next, install the custom resources (CRs) that the Operator requires to run.",
          failed: 'Check your configuration, and then restart the tour from the beginning.',
        },
      },
      {
        title: `Create the knative-serving and knative-eventing APIs`,
        description: `### To create the knative-serving and knative-eventing APIs:
1. On the Installed Operators page, click **OpenShift Serverless Operator**.
2. On the Knative Serving tile, click **Create Instance**.
3. Click **Create**.
4. On the Knative Eventing tile, click **Create Instance**.
5. Click **Create**.`,
        review: {
          instructions: `#### To verify that the knative-serving and knativing-eventing APIs were installed successfully:
1. From the OpenShift Serverless Operator's details page, click the **knative-serving** tab.
2. Verify that there is a knative-serving resource in the list.
3. Click the **knative-eventing** tab.
4. Verify that there is a knative-eventing resource in the list.`
          taskHelp: `Try walking through the steps again to properly create an instance of knative-eventing`,
        },
        recapitulation: {
          success:
            "You just created instances of knative-serving and knative-eventing for the Serverless Operator! You can now deploy serverless applications.",
          failed:
            'Check your work to make sure that instances of knative-serving and knative-eventing are created.',
        },
      },
    ],
    conclusion:
      'Your Serverless Operator is ready! If you want to learn how to deploy a serverless application, take the Serverless Application tour.',
    nextQuickStart: 'serverless-application',
  },
};
