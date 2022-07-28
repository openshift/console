@shipwright @odc-5387
Feature: Shipwright build in topolgy
              As a user, I want check my Shipwright Build in topology.

        Background:
            Given user has installed OpenShift Pipelines Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-shipwright-build-details"
              And user has installed Shipwright Operator
              And user is at Add page
              And user has created shipwright builds


        @smoke @to-do
        Scenario Outline: Sidebar for workload with shipwright build: SWB-02-TC01
            Given user has created workload using yaml "<workload_yaml>"
              And user is at the Topology page
             When user clicks on workload "<workload_name>"
              And user clicks on Resource tab
             Then user will see Shipwright BuildRuns

        Examples:
                  | workload_yaml                                                    | workload_name               |
                  | testData/builds/201-full-openshift-deployment-example.yaml       | sw-deployment-example       |
                  | testData/builds/202-full-openshift-deploymentconfig-example.yaml | sw-deploymentconfig-example |
                  | testData/builds/203-full-openshift-knative-service-example.yaml  | sw-knative-service-example  |


        @regression @to-do
        Scenario Outline: Shipwright build decorator in topology: SWB-02-TC02
            Given user has created workload "<workload_name>"
              And user is at the Topology page
             When user clicks on build decorator for workload "<workload_name>"
             Then user will see "Shipwright Builds" tab

        Examples:
                  | workload_name               |
                  | sw-deployment-example       |
                  | sw-deploymentconfig-example |
                  | sw-knative-service-example  |


        @regression @to-do
        Scenario Outline: Check Shipwright buildrun from topology: SWB-02-TC03
            Given user has created workload using yaml "<workload_yaml>"
              And user is at Shipwright Builds details page for build "<build_name>"
             When user selects "Start Build" from the action menu
              And user navigates to Topology page
             Then user will see build running for "<workload_yaml>"

        Examples:
                  | build_name                        | workload_name               |
                  | sw-deployment-example-build       | sw-deployment-example       |
                  | sw-deploymentconfig-example-build | sw-deploymentconfig-example |
                  | sw-knative-service-example-build  | sw-knative-service-example  |


        @regression @to-do
        Scenario Outline: View logs for shipwright buildrun: SWB-02-TC04
            Given user has created workload "<workload_name>"
              And user is at the Topology page
             When user clicks on workload "<workload_name>"
              And user clicks on Resource tab
              And user clicks on View logs button for build run
             Then user will see Shipwright BuildRuns logs

        Examples:
                  | workload_name               |
                  | sw-deployment-example       |
                  | sw-deploymentconfig-example |
                  | sw-knative-service-example  |
