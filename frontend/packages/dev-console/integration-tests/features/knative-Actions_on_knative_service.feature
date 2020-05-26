Feature: Perform actions on knative service
    As a user I want to perform edit or delete operations and Set Traffic Distribution on knative Service in topology page

Background:
Given open shift cluster is installed with Serverless operator
And user is on dev perspective - topology page
And at least one workload with knative type resource should be available

@regression
Scenario Outline: Verify the knative service context menu options
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user right click on the knative service
   Then user should able to see context menu with "<number_of_context_menu_options>" options
   And context menu should contain "Edit Application Grouping", "Set Traffic Distribution", "Edit NameOfWorkLoad", "Edit Health Checks", "Edit Labels", "Edit Annotations", "Edit Service", "Delete Service"

Examples:
| knative_service_name | number_of_context_menu_options |
| nodejs-ex-git-1      | 8                              |

@regression
Scenario Outline: Remove label from exisitng labels list
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And Remove the "app=label" in the input box present in "Edit Labels" popup
   And click on "save" button on the "Edit Labels" popup
   Then the label "<label_name>" should not display in side pane details

Examples:
| knative_service_name | context_menu_option | label_name |
| nodejs-ex-git-1      | Edit Labels         | app=label  |

@regression
Scenario Outline: perform cancel action on Edit Labels
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And Remove the "app=label" in the input box present in "Edit Labels" popup
   And click on "cancel" button
   Then the label "<label_name>" should display in side pane details

Examples:
Examples:
| knative_service_name | context_menu_option | label_name |
| nodejs-ex-git-1      | Edit Labels         | app=label  |

@regression
Scenario Outline: Add label to the exisitng labels list
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And add the "<label_name>" to the input box present in "Edit Labels" popup
   And click on "save" button on the "Edit Labels" popup
   Then the label "<label_name>" should display in side pane details

Examples:
| knative_service_name | context_menu_option | label_name |
| nodejs-ex-git-1      | Edit Labels         | app=label  |

@regression
Scenario Outline: Remove annotation from exisitng annonations list
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   And number of annotations are "5" present in side pane - details tab- annotation section
   When user selects "<context_menu_option>" option from knative service context menu
   And remove the annotation "<annotation_name>" present in "Edit Annotaions" popup
   And click "save" button on the "Edit Annotaions" popup
   Then verify the number of annotaions equal to "4" in side pane details

Examples:
| knative_service_name | context_menu_option | annotation_name             |
| nodejs-ex-git-1      | Edit Annotations    | serving.knative.dev/creator |

@regression
Scenario Outline: perform cancel action on Edit Annotations
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   And number of annotations are "5" present in side pane - details tab- annotation section
   When user selects "<context_menu_option>" option from knative service context menu
   And remove the annotation "<annotation_name>" present in "Edit Annotaions" popup
   And click on "cancel" button
   Then verify the number of annotaions equal to "5" in side pane details

Examples:
| knative_service_name | context_menu_option | annotation_name             |
| nodejs-ex-git-1      | Edit Annotations    | serving.knative.dev/creator |

@regression
Scenario Outline: Add annotation to the exisitng annonations list
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   And number of annotations are "5" present in side pane details tab- annotation section
   When user selects "<context_menu_option>" option from knative service context menu
   And click on "Add More" button present in "Edit Annotaions" popup
   And type "<annotation_name>" into the "Key" text box
   And type "<annotation_value>" into the "value" text box 
   And click on "save" button on the "Edit Annotations" popup
   Then verify the number of annotaions equal to "6" in side pane details

Examples:
| knative_service_name | context_menu_option | annotation_name             | annotation_value |
| nodejs-ex-git-1      | Edit Annotations    | serving.knative.dev/creator | kube:admin       |

@regression
Scenario Outline: Edit service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And modify the Yaml file of the Revision details pagex 
   And click on "save" button
   Then message should display as "{service name} has been updated to version {nnnnnn}"
   And another message should display as "This object has been updated."

Examples:
| knative_service_name | context_menu_option |
| nodejs-ex-git-1      | Edit Service        |

@regression
Scenario Outline: Update the service to different application group existing in same project
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And  select the "<application_name>" option from "application" drop down present in "Edit Application Grouping" popup
   And click on "save" button
   And search for application name "<application_name>" 
   And click on "<application_name>" on topology page
   Then updated service is present in side pane

Examples:
| knative_service_name | context_menu_option       | application_name |
| nodejs-ex-git-1      | Edit Application Grouping | openshift-app    |

@regression
Scenario Outline: Perform cancel operation while editing application group
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And  select the "openshift-app" option from "application" drop down present in "Edit Application Grouping" popup
   And click on "cancel" button
   And search for application name "<application_name>" 
   And click on "<application_name>" on topology page
   Then updated service should not display in side pane

Examples:
| knative_service_name | context_menu_option       | application_name |
| nodejs-ex-git-1      | Edit Application Grouping | openshift-app    |

@regression
Scenario Outline: Update the service to new application group
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "<context_menu_option>" option from knative service context menu
   And select the "Create Application" option from "application" drop down present in "Edit Application Grouping" popup
   And type "<application_name>" into the "Application Name" text box
   And click on "save" button
   And search for application name "<application_name>" 
   And click on "<application_name>" on topology page 
   Then updated service is present in side pane

Examples:
| knative_service_name | context_menu_option       | application_name |
| nodejs-ex-git-1      | Edit Application Grouping | openshift-app-1  |


@regression
Scenario Outline: Set traffic distribution greater than 100% for the Revisions of the Knative Service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   And service should have at least 1 revision 
   When user selects "<context_menu_option>" option from knative service context menu
   And click on "Add Revision" button present in "Set Traffic Dsitribution" popup
   And type "50" into the "Split" text box of new revision
   And select the "Revision" option from "revision" drop down
   And click "save" buttonn on "Set Traffic Dsitribution" popup
   Then error should display with message as 'admission webhook "validation.webhook.serving.knative.dev" denied the request: validation failed: Traffic targets sum to 150, want 100: spec.traffic'

Examples:
| knative_service_name | context_menu_option      |
| nodejs-ex-git-1      | Set Traffic Distribution |

@regression
Scenario Outline: Set traffic distribution less than 100% for the Revisions of the Knative Service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   And service should have at least 1 revision 
   When user selects "<context_menu_option>" option from knative service context menu
   And type "25" into the "Split" text box
   And click on "Add Revision" button present in "Set Traffic Dsitribution" popup
   And type "50" into the "Split" text box of new revision
   And select the "Revision" option from "revision" drop down
   And click "save" buttonn on "Set Traffic Dsitribution" popup
   Then error should display with message as 'admission webhook "validation.webhook.serving.knative.dev" denied the request: validation failed: Traffic targets sum to 75, want 100: spec.traffic'

Examples:
| knative_service_name | context_menu_option      |
| nodejs-ex-git-1      | Set Traffic Distribution |

@regression
Scenario Outline: Set traffic distribution equal to 100% for the Revisions of the Knative Service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   And service should have at least 1 revision 
   When user selects "<context_menu_option>" option from knative service context menu
   And type "50" into the "Split" text box
   And click on "Add Revision" button present in "Set Traffic Dsitribution" popup
   And type "50" into the "Split" text box of new revision
   And select the "Revision" option from "revision" drop down
   And click "save" buttonn on "Set Traffic Dsitribution" popup
   Then number of routes should get increased in side pane - resources tab - routes section

Examples:
| knative_service_name | context_menu_option      |
| nodejs-ex-git-1      | Set Traffic Distribution |

@regression
Scenario Outline: Perform cancel opeartion on Edit Health Checks for a service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "Edit Health Checks" option from knative service context menu
   And click on "cancel" button
   Then page should navigate to Topology page

@regression
Scenario Outline: Edit Health Checks for a service [TBD]
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "Edit Health Checks" option from knative service context menu
   And 
   And click on "Save" button
   Then 

@regression
Scenario Outline: Perform cancel opeartion on Edit NameOfWorkload for a service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "Edit nodejs-ex-git-1" option from knative service context menu
   And click on "cancel" button present in redirected page
   Then page should navigate to Topology page

@regression
Scenario Outline: Edit NameOfWorkload for a service [TBD]
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "Edit nodejs-ex-git-1" option from knative service context menu
   And select the "Application -1" option from "Application" drop down
   And click on "Save" button
   Then 

@regression
Scenario Outline: Delete service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "Delete Service" option from knative service context menu
   Then popup displayed with header name "Delete Service?" with message as "Are you sure you want to delete {service name} in namespace {project name}?"
   And modal should get closed on clicking "Delete" button
   And service should not be displayed in project

@regression
Scenario Outline: Perform cancel operation on Delete service
   Given searched results are displayed with knative service name "<knative_service_name>" on topology page
   When user selects "Delete Service" option from knative service context menu
   Then popup displayed with header name "Delete Service?" with message as "Are you sure you want to delete {service name} in namespace {project name}?"
   And modal should get closed on clicking "Cancel" button
   And service should be displayed in project
