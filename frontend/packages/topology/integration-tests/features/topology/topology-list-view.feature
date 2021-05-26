@topology
Feature: List view in topology
              As a user, I want to see list view in topology

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-list-view"
              And user is at Add page


        @smoke
        Scenario: Topology List view: T-12-TC01
            Given user has created workload "nodejs-ex-git-d" with resource type "Deployment"
             When user clicks on List view button
             Then user will see workloads are segregated by applications groupings


        @regression @manual
        Scenario: Drag and drop jar file in topology list view: T-12-TC02
            Given user has a jar file named "sample_yaml_upload.yaml"
              And user is at the Topology list view page
             When user drags and drop jar file on topology
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload" in Upload JAR file form
              And user clicks on Create
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see deployment "sample-yaml-upload" in application "sample-upload-app" is created in topology


        @regression @manual
        Scenario: Drag and drop Incompatible file in topology list view: T-12-TC03
            Given user has a incompatible file
              And user is at the Topology list view
             When user drags and drop the file on topology
             Then the curser will show the action is not available


        @regression @manual
        Scenario: View shortcuts menu: T-12-TC04
            Given user has uploaded a jar file
             When user clicks on View shortcuts in topology list view
             Then user sees shortcut for Drag and drop a JAR file into Topology
