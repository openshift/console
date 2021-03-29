@topology
Feature: Editing an application
              As a user, I want to edit an application

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-editing-app-node"


        @smoke
        Scenario Outline: Editing a workload : T-06-TC14, T-06-TC15
            Given user has created workload "<workload_name>"  with resource type "<resource_type>"
              And user is at the Topolgy page
             When user right clicks on the node "<workload_name>" to open context menu
              And user selects option "Edit <workload_name>" from context menu
              And user can see Edit form
              And user verifies that name of the node and route option is not editable
              And user verifies that Application grouping, git url, builder image version and advanced option can be edited
              And user edits Application name as "nodejs-ex-git-app-1"
              And user clicks on save
             Then user can see the change of node to the new Application "nodejs-ex-git-app-1"

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git   |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario: Editing a knative service : T-06-TC14, T-06-TC15
            Given user has created knative workload "nodejs-ex-git"
              And user is at the Topolgy page
             When user right clicks on the node "nodejs-ex-git" to open context menu
              And user selects option "Edit Service" from context menu
              And user can see Edit form
              And user verifies that name of service and route option is not editable
              And user verifies that Application grouping, git url, builder image version and advanced option can be edited
              And user edits Application name as "nodejs-ex-git-app-1"
              And user clicks on save
             Then user can see the change of knative service to the new Application defined above


        @regression @manual
        Scenario: Edit JAR file through drag and drop
            Given user has uploaded JAR file
             When user opens sidebar of the file
              And user clicks on Edit app in Action menu
              And user drag and drop a new JAR file in JAR file section
              And user updates Build image version
              And user clicks on Save
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs
