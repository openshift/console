@shipwright @odc-5387
Feature: Shipwright build in topolgy
              As a user, I want check my Shipwright Build in topology.

        Background:
            Given user has installed OpenShift Pipelines Operator
              And user has installed Shipwright Operator
              And user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-shipwright-build-details"
              And user is at Add page
              And user has created shipwright builds with resources
              And user is at namespace "aut-shipwright-build-details"


        @smoke
        Scenario Outline: Topology page in dev perspective: SWB-02-TC01
             When user navigates to Topology in Developer perspective
              And user filters the workload "<workload_name>" by name and sets the workload type to "<workload_type>"
              And user clicks on the Build decorator attached to "<workload_name>"
             Then user will be redirected to the buildRun logs page
              And user will be able to see the buildRun logs

        Examples:
                  | workload_name           | workload_type    |
                  | sw-deployment-app       | Deployment       |
                  | sw-deploymentconfig-app | DeploymentConfig |
                  | sw-knative-service-app  | Service          |


        @regression
        Scenario Outline: BuildRun Section in Topology Sidebar: SWB-02-TC02
             When user navigates to Topology in Developer perspective
              And user filters the workload "<workload_name>" by name and sets the workload type to "<workload_type>"
              And user clicks on the workload of type "<workload_type>"
             Then user will clicks on the Resources tab on the topology sidebar for "<workload_name>"
              And user will verify BuildRuns section is visible

        Examples:
                  | workload_name               | workload_type    |
                  | sw-deployment-example       | Deployment       |
                  | sw-deploymentconfig-example | DeploymentConfig |
                  | sw-knative-service-example  | Service          |


        @regression
        Scenario Outline: Check Shipwright buildrun from topology: SWB-02-TC03
            Given user is at Shipwright Builds details page for build "<build_name>"
             When user selects "Start" option from Actions menu
              And user navigates to Topology in Developer perspective
              And user filters the workload "<workload_name>" by name and sets the workload type to "<workload_type>"
             Then user will see build running for "<workload_type>"

        Examples:
                  | build_name                        | workload_name               | workload_type    |
                  | sw-deployment-example-build       | sw-deployment-example       | Deployment       |
                  | sw-deploymentconfig-example-build | sw-deploymentconfig-example | DeploymentConfig |
                  | sw-knative-service-example-build  | sw-knative-service-example  | Service          |


        @regression
        Scenario Outline: View logs for shipwright buildrun: SWB-02-TC04
            When user navigates to Topology in Developer perspective
              And user filters the workload "<workload_name>" by name and sets the workload type to "<workload_type>"
              And user clicks on View logs button for buildrun for workload type "<workload_type>" from the sidebar
             Then user will be able to see the buildRun logs

        Examples:
                  | workload_name               | workload_type    |
                  | sw-deployment-example       | Deployment       |
                  | sw-deploymentconfig-example | DeploymentConfig |
                  | sw-knative-service-example  | Service          |
