@knative-serverless
Feature: side bar details
              As a user, I want to see the details of the revision and service in side bar

        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-knative-side-pane-details"


        @precondition
        Scenario Outline: Create knative workload from Container Images on Add page: KN-05-TC04
            Given user is at Add page
              And user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user selects the "<runtime_icon>" from Runtime Icon dropdown
              And user selects the application "sample-app" from Application dropdown
              And user enters Name as "<name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user will see the deployed image "<name>" with "<runtime_icon>" icon
              And user is able to see Knative Revision

        Examples:
                  | name         | image_name                | runtime_icon |
                  | hello-secure | openshift/hello-openshift | fedora       |


        @smoke
        Scenario: Sidebar details of knative Service: KN-06-TC01
            Given user has created knative service "nodejs"
             When user clicks on the knative service "nodejs"
             Then side bar is displayed with heading name as "nodejs"
              And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details
              And Pods, Revisions, Routes and Builds displayed in Resources section
    # And Name display as "nodejs-ex-git-1" in topology details
    # And Namespace display as "aut-knative-side-pane-details" in topology details
    # And Labels section contain n number of Labels in topology details
    # And Annotations section contain "{number of annotations} Annotations" in topology details
    # And "Created on" field display the date in format "{month date, hour:minutes am/pm}" in topology details
    # And owner field displayed in topology details


        @smoke
        Scenario: Sidebar details of knative Revision: KN-06-TC02
            Given user has created knative service "nodejs"
             When user clicks on the revision of knative service "nodejs"
             Then side bar is displayed with heading name as "nodejs"
              And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details
              And Pods, Deployment, Routes and Configurations displayed in Resources section


        @regression
        Scenario: Actions menu of knative revision in side bar: KN-06-TC03
            Given user has created knative service "nodejs"
             When user clicks on the revision of knative service "nodejs"
              And user clicks on Actions dropdown in top right corner of side bar
             Then user able to see the options "Edit labels", "Edit annotations", "Edit Revision", "Delete Revision"


        @regression
        Scenario: Resoruce details of knative service in side bar: KN-06-TC04
            Given user has created knative service "nodejs"
             When user clicks on the knative service "nodejs"
              And user clicks on Resources tab
             Then user able to see the "Pods", "Routes", "Revisions", "Builds" sections


        @regression
        Scenario: Actions menu of knative service in side bar: KN-06-TC05
            Given user has created knative service "nodejs"
             When user clicks on the knative service "nodejs"
              And user clicks on Actions dropdown in top right corner of side bar
             Then user able to see the options like "Edit application grouping", "Set traffic distribution", "Edit Health Checks", "Edit labels", "Edit annotations", "Edit Service", "Delete Service", "Edit resource limits", "Edit nodejs", "Create Service Binding"
