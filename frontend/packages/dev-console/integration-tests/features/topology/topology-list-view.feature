@topology
Feature: List view in topology
              As a user, I want to see list view in topology

        Background:
            Given user is at developer perspective
              And user has selected namespace "aut-topology-list-view"


        @smoke
        Scenario: Topology List view : T-07-TC05
            Given user created workload "nodejs-ex-git" with resource type "Deployment"
             When user clicks on List view button
              And user verifies the filter by resource on top
             Then user will see workloads are segregated by applications groupings


        @regression
        Scenario: Topology filter by resource: T-07-TC06, T-07-TC07
            Given user created two workloads with resource type "Deployment" and "Deployment-Config"
             When user clicks on List view button
              And user clicks the filter by resource on top
              And user will see "Deployment" and "Deployment-Config" options with '1' associated with it
              And user clicks on Deployment
              And user can see only the deployment workload
              And user clicks on Deployment-Config
             Then user can see only the deployment-config workload


        @regression, @manual
        Scenario: Drag and drop jar file in topology list view
            Given user has a jar file named "sample_yaml_upload.yaml"
              And user is at the Topology list view page
             When user drags and drop jar file on topology
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload" in Upload JAR file form
              And user clicks on Create
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see deployment "sample-yaml-upload" in application "sample-upload-app" is created in topology


        @regression, @manual
        Scenario: Drag and drop Incompatible file in topology list view
            Given user has a incompatible file
              And user is at the Topology list view
             When user drags and drop the file on topology
             Then the curser will show the action is not available


        @regression, @manual
        Scenario: View shortcuts menu
            Given user has uploaded a jar file
             When user clicks on View shortcuts in topology list view
             Then user sees shortcut for Drag and drop a JAR file into Topology


        @regression, @manual
        Scenario: Drag and drop Incompatible file in topology list view
            Given user has a incompatible file
              And user is at the Topology list view
             When user drags and drop the file on topology
             Then a toast warning message will appear stating that the file is invalid.
