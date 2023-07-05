@topology @broken-test
# Pipelines operator not installing correctly

Feature: Improve the integration of Pipelines & Builds.
              As a user, I want to see pipelines instead of build

        Background:
            Given user has installed OpenShift Pipelines Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression
        Scenario Outline: Pipelines are getting executed successfully: T-01-TC01
            Given user has created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the pipelines page
             Then user can see the "<workload_name>" pipeline is succeeded

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario Outline: PVC getting created through the add flow pipeline auto start feature: T-01-TC02
            Given user has created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the Administrator perspective
              And user clicks on the Persistent Volume Claims in Storage tab
             Then user can see workspace created for the resource

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario Outline: PVC getting auto selected using the pipeline label attached to it: T-01-TC03
            Given user has created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the pipelines page
              And user clicks on Start on the "<workload_name>" pipeline
             Then user can see "PVC" in workspace with name of PVC

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario Outline: In Add trigger, PVC getting auto selected: T-01-TC04
            Given user has created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the pipelines page
              And user clicks on Add Trigger on the "<workload_name>" pipeline
             Then user can see "PVC" in workspace with name of PVC

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario Outline: Pipeline section in edit flow when pipeline is already present: T-01-TC05
            Given user has created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user clicks on Edit "<workload_name>" from action menu
             Then user can see Pipeline checkbox is disabled
              And user can not see Build configuration option in Advanced Options

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario Outline: Pipeline section in edit flow when pipeline is not present: T-01-TC06
            Given user has created workload "<workload_name>" with resource type "<resource_type>" without pipeline
             When user clicks on Edit "<workload_name>" from action menu
             Then user can see Pipeline section is present
              And user can see Pipeline checkbox is present in enabled state

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-2 |
                  | deployment config | dancer-ex-git-2 |


        @regression
        Scenario Outline: Pipeline is enabled through edit flow: T-01-TC07
            Given user has created workload "<workload_name>" with resource type "<resource_type>" without pipeline
             When user clicks on Edit "<workload_name>" from action menu
              And user checks the Pipeline checkbox to disable build configuration in Advanced Options
              And user clicks on Save button
             Then user can see PipelineRuns section is present
              And user can see Build section is present

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-2 |
                  | deployment config | dancer-ex-git-2 |


        @regression @odc-6375
        Scenario Outline: Topology sidebar has Triggers section in Resources tab: T-01-TC8
            Given user has created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user navigates to Topology page
              And user clicks on workload "<workload_name>" to open sidebar
             Then user can see "Triggers" section in Resources tab

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |
