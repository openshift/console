Feature: Perform actions on knative revision
    As a user, I want to perform edit or delete operations on knative revision in topology page

Background:
   Given open shift cluster is installed with Serverless operator
   And user is at developer perspecitve
   And user has selected namespace "aut-knative-actions-revision"


@regression, @smoke
Scenario Outline: Knative revision menu options : Kn-03-TC01
   Given knative service named "<service_name>" is higlighted on topology page
   When user right clicks on the revision of knative service "<service_name>"
   Then user is able to see context menu with options Edit Labels, Edit Annotations, Edit Revision, Delete Revision

Examples:
    | service_name    | 
    | nodejs-ex-git-2 |


@regression
Scenario: Edit labels modal details : Kn-03-TC02
   Given knative service named "<service_name>" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   Then modal with "Edit Labels" appears
   And save button is disabled


@regression, @smoke
Scenario: Add label to the existing labels list : Kn-03-TC03
   Given knative service named "nodejs-ex-git-2" is higlighted on topology page
   When user right clicks on the revision of knative service "nodejs-ex-git-2" 
   And user selects "Edit Labels" option from knative revision context menu
   And add the label "app=label" to existing labels list in Edit Labels modal
   And user clicks save button on the "Edit Labels" modal
   Then user can see the label "app-label" in the Details tab of the Sidebar of "nodejs-ex-git-2"


@regression
Scenario: Remove label from existing labels list : Kn-03-TC04
   Given knative service named "<service_name>" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   And removes the label "app=label" from existing labels list in "Edit Labels" modal
   And user clicks save button on the "Edit Labels" modal
   Then the label "app=label" will not display in side bar details


@regression
Scenario: Add labels to existing labels list and cancel the activity : Kn-03-TC05
   Given knative service named "<service_name>" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   And add the label "app=label" to existing labels list in Edit Labels modal
   And clicks cancel button on the "Edit Labels" modal
   Then the label "app=label" will not display in side bar details


@regression
Scenario: Edit Annotation modal details : Kn-03-TC06
   Given knative service named "<service_name>" is higlighted on topology page
   When user selects "Edit Annotaions" option from knative revision context menu
   Then modal with "Edit Annotations" appears
   And key, value columns are displayed with respecitve text fields
   And Add more link is enabled
   And save button is disabled


@regression, @smoke
Scenario Outline: Add annotation to the existing annonations list : Kn-03-TC07
   Given knative service named "nodejs-ex-git-2" is higlighted on topology page
   And number of annotations are "5" present in revision side bar details of service "nodejs-ex-git-2"
   When user right clicks on the revision of knative service "nodejs-ex-git-2" 
   And user selects "Edit Annotaions" option from knative revision context menu
   And clicks Add button on the Edit Annotaions modal
   And enters annotation key as "<key_name>"
   And enters annotation value as "<key_value>"
   And user clicks save button on the "Edit Annotaions" modal
   Then number of annotaions increased to "6" in revision side bar details of service "nodejs-ex-git-2"

Examples:
| key_name                    | key_value  |
| serving.knative.dev/creator | kube:admin |


@regression
Scenario Outline: perform cancel action on Edit Annotations : Kn-03-TC09
   Given knative service named "<service_name>" is higlighted on topology page
   And number of annotations are "6" present in side bar - details tab- annotation section
   When user selects "Edit Annotations" option from knative revision context menu
   And click on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" modal
   And clicks cancel button on the "Edit Annotaions" modal
   Then verify the number of annotaions equal to "6" in side bar details

Examples:
| key_name                    |
| serving.knative.dev/creator |


Scenario Outline: Remove annotation from existing annonations list : Kn-03-TC08 
   Given knative service named "<service_name>" is higlighted on topology page
   And number of annotations are "6" present in side bar - details tab
   When user selects "Edit Annotaions" option from knative revision context menu
   And click on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" modal
   And user clicks save button on the "Edit Annotaions" modal
   Then verify the number of annotaions decreased to "5" in side bar details

Examples:
| key_name                    |
| serving.knative.dev/creator |


@regression, @manual
Scenario: Edit revision details page : Kn-03-TC10
   Given knative service named "<service_name>" is higlighted on topology page
   When user selects "Edit Revision" option from knative revision context menu
   And user clicks on Details tab
   Then details tab displayed with Revision Details and Conditions sections
   And Revision details contains fields like Name, Namespace, Labels, Annotations, Created At, Owner


@regression, @smoke, @manual
Scenario: Update the revision detials : Kn-03-TC11
   Given knative service named "<service_name>" is higlighted on topology page
   When user selects "Edit Revision" option from knative revision context menu
   And modify the Yaml file of the Revision details page
   And user clicks "save" button on Revision Yaml page
   Then the message display as "{revision name} has been updated to version {nnnnnn}"
   And another message display as "This object has been updated."


@regression
Scenario Outline: Delete revision modal details for service with multiple revisions : Kn-03-TC13
   Given knative service named "<service_name>" is higlighted on topology page
   And service should contain multiple revisions 
   When user selects "Delete Revision" option from knative revision context menu
   Then modal with "Update the traffic distribution among the remaining Revisions" appears
   And modal should get closed on clicking OK button


@regression
Scenario Outline: Delete revision for the service which contains multiple revisions : Kn-03-TC14


@regression, @smoke
Scenario: Delete Revision not possible for the service which contains one revision : Kn-03-TC12
   Given knative service named "<service_name>" is higlighted on topology page
   When user right clicks on the revision of knative service "nodejs-ex-git-2"
   And user selects "Delete Revision" option from knative revision context menu
   Then modal with "Unable to delete revision" appears
   And modal contains message as "You cannot delete the last Revision for the Service."
   And modal should get closed on clicking OK button
