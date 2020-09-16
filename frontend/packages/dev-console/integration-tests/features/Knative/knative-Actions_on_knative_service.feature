Feature: Perform actions on knative service
    As a user I want to perform edit or delete operations and Set Traffic Distribution on knative Service in topology page

Background:
   Given user has installed Openshift Serverless operator
   And user is at developer perspecitve
   And user has selected namespace "aut-create-knative-actions-service"


@regression, @smoke
Scenario Outline: knative service menu options: Kn-04-TC01
   Given knative service named "<service_name>" is higlighted on topology page
   When user right clicks on the knative service "<service_name>"
   Then user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, "<service_name>"

Examples:
   | service_name    | 
   | nodejs-ex-git-1 |


@regression
Scenario: Edit labels modal details : Kn-04-TC02
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git-1"
   Then modal with "Edit Labels" appears
   And save button is disabled


@regression, @smoke
Scenario: Add label to the exisitng labels list : Kn-04-TC03
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git-1"
   And user adds the label "app=label" to exisitng labels list in Edit Labels modal
   And user clicks the save button on the "Edit Labels" modal
   Then the label "app=label" display in "nodejs-ex-git-1" service side bar details


@regression
Scenario: Remove label from exisitng labels list : Kn-04-TC04
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git-1"
   And user removes the label "app=label" from exisitng labels list in "Edit Labels" modal
   And user clicks the save button on the "Edit Labels" modal
   Then the label "app=label" will not display in "nodejs-ex-git-1" service side bar details


@regression
Scenario: Add labels to exisitng labels list and cancel it : Kn-04-TC05
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git-1"
   And user adds the label "app=label" to exisitng labels list in Edit Labels modal
   And user clicks cancel button on the "Edit Labels" modal
   Then user will not see the label "app-label" in the Details tab of the Sidebar of "nodejs-ex-git-2"


@regression
Scenario: Edit Annotation modal details : Kn-04-TC11
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Annotaions" context menu option of knative service "nodejs-ex-git-1"
   Then modal with "Edit Annotations" appears
   And key, value columns are displayed with respecitve text fields
   And Add more link is enabled
   And save button is disabled


@regression, @smoke
Scenario: Add annotation to the exisitng annonations list : Kn-04-TC12
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   And number of annotations are "5" present in "nodejs-ex-git-1" service side bar details tab
   When user selects "Edit Annotaions" context menu option of knative service "nodejs-ex-git-1"
   And user clicks Add button on the Edit Annotaions modal
   And user enters annotation key as "serving.knative.dev/creator "
   And user enters annotation value as "kube:admin" 
   And user clicks the save button on the "Edit Annotaions" modal
   Then number of annotaions increased to "6" in "nodejs-ex-git-1" service side bar details


Scenario: perform cancel action after Edit Annotations : Kn-04-TC14
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   And number of annotations are "6" present in side bar - details tab- annotation section
   When user selects "Edit Annotations" context menu option of knative service "nodejs-ex-git-1"
   And user clicks on remove icon for the annotation with key "serving.knative.dev/creator" present in Edit Annotaions modal
   And user clicks cancel button on the "Edit Annotaions" modal
   Then number of annotaions remains same in side bar details


@regression
Scenario: Remove annotation from exisitng annonations list : Kn-04-TC13
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   And number of annotations are "6" present in side bar - details tab
   When user selects "Edit Annotaions" context menu option of knative service "nodejs-ex-git-1"
   And user clicks on remove icon for the annotation with key "serving.knative.dev/creator" present in Edit Annotaions modal
   And user clicks the save button on the "Edit Annotaions" modal
   Then number of annotaions decreased to "5" in side bar details


@regression
Scenario: Edit the service from yaml editor: Kn-04-TC15
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Service" context menu option of knative service "nodejs-ex-git-1"
   And user modifies the Yaml file of the Revision details page 
   And user clicks save button on yaml page
   Then message should display as "{service name} has been updated to version {nnnnnn}"
   And another message should display as "This object has been updated."


@regression
Scenario Outline: Update the service to different application group existing in same project : Kn-04-TC07
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Application Grouping" context menu option of knative service "nodejs-ex-git-1"
   And user selects the "<application_name>" from "application" drop down present in "Edit Application Grouping" modal
   And user clicks the save button on the "Edit Application Grouping" modal
   And user searches for application name "<application_name>" 
   And user clicks on "<application_name>" on topology page
   Then updated service is present in side bar

Examples:
| application_name |
| openshift-app    |


Scenario Outline: Perform cancel operation while editing application group : Kn-04-TC08
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Application Grouping" context menu option of knative service "nodejs-ex-git-1"
   And user selects the "openshift-app" option from "application" drop down present in "Edit Application Grouping" modal
   And user clicks cancel button on the "Edit Application Grouping" modal
   And user searches for application name "<application_name>" 
   And user clicks on "<application_name>" on topology page
   Then updated service should not display in side bar

Examples:
| application_name |
| openshift-app    |


@regression
Scenario Outline: Update the service to new application group : Kn-04-TC06
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Application Grouping" context menu option of knative service "nodejs-ex-git-1"
   And user selects the "Create Application" option from "application" drop down present in "Edit Application Grouping" modal
   And user enters "<application_name>" into the "Application Name" text box
   And user clicks the save button on the "Edit Application Grouping" modal
   And user searches for application name "<application_name>" 
   And user clicks on "<application_name>" on topology page 
   Then updated service is present in side bar

Examples:
| application_name |
| openshift-app-1  |


@regression
Scenario: Set traffic distribution greater than 100% for the Revisions of the knative Service : Kn-04-TC17
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   And service should have at least 1 revision 
   When user selects "Set Traffic Distribution" context menu option of knative service "nodejs-ex-git-1"
   And user clicks on "Add Revision" button present in "Set Traffic Distribution" modal
   And user enters "50" into the "Split" text box of new revision
   And user selects the "Revision" option from "revision" drop down
   And user clicks the save button on the "Set Traffic Distribution" modal
   Then error message displays as "validation failed: Traffic targets sum to 150, want 100: spec.traffic"


@regression
Scenario: Set traffic distribution less than 100% for the Revisions of the knative Service : Kn-04-TC18
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   And service should have at least 1 revision 
   When user selects "Set Traffic Distribution" context menu option of knative service "nodejs-ex-git-1"
   And user enters "25" into the "Split" text box
   And user clicks on "Add Revision" button present in "Set Traffic Distribution" modal
   And user enters "50" into the "Split" text box of new revision
   And user selects the "Revision" option from "revision" drop down
   And user clicks the save button on the "Set Traffic Distribution" modal
   Then error message displays as "validation failed: Traffic targets sum to 75, want 100: spec.traffic"


@regression, @smoke
Scenario: Set traffic distribution equal to 100% for the Revisions of the knative Service : Kn-04-TC19
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   And service should have at least 1 revision 
   When user selects "Set Traffic Distribution" context menu option of knative service "nodejs-ex-git-1"
   And user enters "50" into the "Split" text box
   And user clicks on "Add Revision" button present in "Set Traffic Distribution" modal
   And user enters "50" into the "Split" text box of new revision
   And user selects the "Revision" option from "revision" drop down
   And user clicks the save button on the "Set Traffic Distribution" modal
   Then number of routes should get increased in side bar - resources tab - routes section


Scenario: Perform cancel opeartion on Edit Health Checks for a service : Kn-04-TC10
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Health Checks" context menu option of knative service "nodejs-ex-git-1"
   And user clicks cancel button on "Edit Health Checks" page
   Then user will be redirected to Topology page


@regression
Scenario: Edit Health Checks for a service: Kn-04-TC09
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit Health Checks" context menu option of knative service "nodejs-ex-git-1"


Scenario: Perform cancel opeartion on Edit NameOfWorkload for a service : Kn-04-TC21
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Edit nodejs-ex-git-1" context menu option of knative service "nodejs-ex-git-1"
   And user clicks cancel button on "Edit Service" page
   Then user will be redirected to Topology page


@regression
Scenario: Edit NameOfWorkload for a service [TBD] : Kn-04-TC20
   Given knative service named "nodejs-ex-git-1" is higlighted on topology pagee
   When user selects "Edit nodejs-ex-git-1" context menu option of knative service "nodejs-ex-git-1"
   And user selects the "Application -1" option from "Application" drop down
   And user clicks on "Save" button


@regression, @smoke
Scenario: Delete service : Kn-04-TC16
   Given knative service named "nodejs-ex-git-1" is higlighted on topology page
   When user selects "Delete Service" context menu option of knative service "nodejs-ex-git-1"
   Then modal with "Delete Service?" appears
   And modal get closed on clicking Delete button
   And "nodejs-ex-git-1" service should not be displayed in project
