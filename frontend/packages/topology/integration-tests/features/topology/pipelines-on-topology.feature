@topology
Feature: Improve the integration of Pipelines & Builds.
              As a user, I want to see pipelines instead of build

        Background:
            Given user has installed OpenShift Pipelines operator using cli
              And user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression @to-do
        Scenario Outline: Pipelines are getting executed successfully: T-01-TC01
            Given user created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the pipeline
             Then user can see the "<workload_name>" pipeline is succeeded

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: PVC getting created through the add flow pipeline auto start feature: T-01-TC02
            Given user created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the Administrator perspective
              And user clicks on the Persistent Volume Claims in Storage tab
             Then user can see workspace created for for the resource

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: PVC getting auto selected using the pipeline label attached to it: T-01-TC03
            Given user created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the pipeline
              And user clicks on Start on the "<workload_name>" pipeline
             Then user can see "PVC" in workspace with name of PVC

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: In Add trigger, PVC getting auto selected: T-01-TC04
            Given user created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user goes to the pipeline
              And user clicks on Add Trigger on the "<workload_name>" pipeline
             Then user can see "PVC" in workspace with name of PVC

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: Pipeline section in edit flow when pipeline is already present: T-01-TC05
            Given user created workload "<workload_name>" with resource type "<resource_type>" with pipeline
             When user clicks on Edit "<workload_name>" from action menu
             Then user can see Pipeline checkbox is disabled
              And user can not see Build configuration option in Advanced Options

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: Pipeline section in edit flow when pipeline is not present: T-01-TC06
            Given user created workload "<workload_name>" with resource type "<resource_type>" without pipeline
             When user clicks on Edit "<workload_name>" from action menu
             Then user can see Pipeline section is present
              And user can see Pipeline checkbox is present in enabled state

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: Pipeline is enabled through edit flow: T-01-TC07
            Given user created workload "<workload_name>" with resource type "<resource_type>" without pipeline
             When user clicks on Edit "<workload_name>" from action menu
              And user checks the Pipeline checkbox to disable build configuration in Advanced Options
              And user clicks on Save
              And user opens sidebar of workload " <workload_name>"
             Then user can see Pipeline section is present
              And user can see Build config section is present

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git-1 |
                  | deployment config | dancer-ex-git-1 |


        @regression @to-do
        Scenario Outline: Pipeline section when builder image is changed to one having pipeline associated: T-01-TC08
            Given user created workload "<workload_name>" with resource type "<resource_type>" and builder image "<builder_image1>" with pipeline
             When user clicks on Edit "<workload_name>" from action menu
              And user edit the application with  "<builder_image2>"
             Then user will see the message "Pipeline will be updated to match the builder image" with pipeline option selected

        Examples:
                  | resource_type     | workload_name   | builder_image1 | builder_image2 |
                  | deployment        | nodejs-ex-git-1 | Node.js        | Python         |
                  | deployment config | django-ex.git-1 | Python         | Perl           |


        @regression @to-do
        Scenario Outline: Pipeline section when builder image is changed to one not having pipeline associated: T-01-TC09
            Given user created workload "<workload_name>" with resource type "<resource_type>" and builder image "<builder_image1>" with pipeline
             When user clicks on Edit "<workload_name>" from action menu
              And user edit the application with  "<builder_image2>"
             Then user will see the message "There are no pipeline templates available for "<builder_image2>", current pipeline will be dissociated from the application"

        Examples:
                  | resource_type     | workload_name   | builder_image1 | builder_image2 |
                  | deployment        | nodejs-ex-git-1 | Node.js        | Nginx          |
                  | deployment config | django-ex.git-1 | Python         | Httpd          |
