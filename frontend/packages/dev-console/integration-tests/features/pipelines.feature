Feature: Pipelines
    As a user I want to create, execute, edit and delete the pipeline

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline and knative operators
    And user is on dev perspecitve
    And user is on a project namespace "AUT_MB_Demo"
    
@e2e, @regression, @smoke
Scenario Outline: Create a pipeline with git workload : P-02-TC01, P-02-TC02, P-02-TC03
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type Name as "<name>" in General section
   And select "<resource>" radio button in Resources section
   And select "Add Pipeline" checkbox in Pipelines section
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present in topology page
   And pipeline name "<pipeline_name>" is displayed in side pane for created node
   And pipeline name "<pipeline_name>" is displayed in Pipelines page

Examples:
| git_url                                 | pipeline_name    | resource          | name             |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-D  | Deployment        | nodejs-ex.git-D  |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-DC | Deployment Config | nodejs-ex.git-DC |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-Kn | Knative           | nodejs-ex.git-Kn |


@regression
Scenario Outline: Verify the pipeline template
   Given user is on "git" form with header name "Import from git"
   And a message displays in pipeline section as "Select a builder image and resource to see if there is a pipeline template available for this runtime."
   When user type "Git Repo url" as "<git_url>"
   Then "Add pipeline" checkbox should be displayed

Examples:
| git_url                                                   | resource_type | app_name                  | name                  |
| https://github.com/sclorg/dancer-ex.git                   | Deployment    | dancer-ex.git-app         | dancer-ex.git         |
| https://github.com/sclorg/cakephp-ex.git                  | Deployment    | cakephp-ex.git -app       | cakephp-ex.git        |
| https://github.com/sclorg/nginx-ex.git                    | Deployment    | nginx-ex.git-app          | nginx-ex.git          |
| https://github.com/sclorg/httpd-ex.git                    | Deployment    | httpd-ex.git-app          | httpd-ex.git          |  
| https://github.com/redhat-developer/s2i-dotnetcore-ex.git | Deployment    | s2i-dotnetcore-ex.git-app | s2i-dotnetcore-ex.git |
| https://github.com/sclorg/golang-ex.git                   | Deployment    | golang-ex.git-app         | golang-ex.git         | 
| https://github.com/sclorg/ruby-ex.git                     | Deployment    | ruby-ex.git -app          | ruby-ex.git           |
| https://github.com/sclorg/django-ex.git                   | Deployment    | django-ex.git-app         | django-ex.git         |
| https://github.com/jboss-openshift/openshift-quickstarts  | Deployment    | openshift-quickstarts-app | openshift-quickstarts |
| https://github.com/sclorg/nodejs-ex.git                   | Deployment    | nodejs-ex.git-app         | nodejs-ex.git         |

@regression
Scenario Outline: verify the pipelines page before execution : P-04-TC05
   Given user is on pipelines page
   And pipeline with name "<pipeline_name>" with out execution should be available
   When user searches with pipeline name "<pipeline_name>" on Pipelines page
   Then filtered results with pipeline name "<pipeline_name>" shoould be displayed
   And pipelines table displayed with column names "Name", "Namespace", "Last Run", "Task Status", "Last Run Status" and "Last Run Time"
   And Name should display as "<pipeline_name>"
   And Namespace should display as "AUT_MB_Demo"
   And Last Run should display as "-"
   And Task Run Status should dsiplays as "-"
   And Last Run Status should display as "-"
   And Last Run Time should display as "-"
   And kebab menu should display with following options "Start", "Add Trigger", "Remove Trigger", "Edit Pipeline", "Delete Pipeline"

Examples:
| pipeline_name |
| nodejs-ex.git |

@e2e
Scenario Outline: Start the pipeline in Pipelines page : P-04-TC01
    Given user is on "Pipelines" page
    When user searches for the application name "<pipeline_name>"
    And selects the "start" option from the kebab menu of the displayed pipeline
    Then popup displayed with header name "Start Pipeline"
    And "APP_NAME" should be displayed
    And "Source", "Image Resources" dropdowns are auto selected
    When user clicks on "Start" button present on "Start Pipeline" popup
    Then user naivgates to "Pipeline Run Details" page
    And pipeline run name should contain "<pipeline_name>"
    And pipeline status displays as "<pipeline_status>"
    And the Last run status of the "<pipeline_name>" displays as "<pipeline_status>" in pipelines page    

Examples:
| pipeline_name | pipeline_status |
| nodejs-ex-git | Running         |

@e2e
Scenario Outline: Verify the details of completed pipeline run
    Given user is on "Pipeline Run Details" page
    Then the pipelien run status displays as "<pipeline_status>" in Pipeline run page
    And the Last run status of the "<pipeline_name>" displays as "<pipeline_status>" in pipelines page

Examples:
| pipeline_name | pipeline_status |
| nodejs-ex-git | Succeeded       |

@regression
Scenario Outline: Create a workload from Docker file : P-02-TC04
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "Git Repo url" as "<docker_git_url>" 
   And select "Add Pipeline" checkbox in Pipelines section
   And click "Create" button on Add page   
   Then user navigates to topology page
   And created workload is present in List View of topology page
   And pipeline name "<pipeline_name>" is displayed in Pipelines page

Examples:
| form_name   | header_name             | docker_git_url            | 
| Docker file | Import from Docker file | openshift/hello-openshift |

@regression
Scenario: Create a pipeline with S2I builder images : P-02-TC05
   Given user is on "<form_name>" form with header name "<header_name>"
   And builder images are displayed
   When user search and select the "node" card
   And create the application with the selected builder image
   And user type "Git Repo url" as "<docker_git_url>" 
   And select "Add Pipeline" checkbox in Pipelines section
   And click "Create" button on Create Source to Image application
   Then user navigates to topology page
   And created workload is present in List View of topology page
   And pipeline name "<pipeline_name>" is displayed in Pipelines page

Examples:
| form_name    | header_name  | docker_git_url            | 
| Catalog file | user Catalog | openshift/hello-openshift |

@regression, @smoke
Scenario Outline: Create a pipeline from pipeline builder page : P-03-TC01, P-03-TC08, P-03-TC02
    Given user is on pipeline builder page 
    When user clicks "Create Pipeline" button on Pipelines page
    And type "Name" as "<pipeline_name>"
    And select option from "Task" drop down as "<task_name>"
    And user clicks "Add Resources" link on Pipelines Builder page
    And type "Resource Name" as "<resource_name>" in Resoruces section
    And select option from "Resource Type" drop down as "<resource_type>"
    And click task "<task_name>" in Tasks section
    And select option from "Input Resources" dropdown as "<resource_name>" in right side pane
    And click "Create" button on Pipeline Builder page
    Then user navigates to Pipeline Details page with header name as "<pipeline_name>"
    And Name should display as "<pipeline_name>" on Details tab
    And Namespace should display as "AUT_MB_Demo" on Details tab
    And Tasks should contain "<task_name>"

Examples:
| pipeline_name | task_name        | resource_name | resource_type |
| pipelines-one | openshift-client | git repo      |  Git          |

@regression, @smoke
Scenario Outline: Verify the pipelines Details page : P-03-TC01
   Given user is on pipelines page
   And pipeline with name "<pipeline_name>"
   When user searches with pipeline name "<pipeline_name>" on Pipelines page
   And click pipeline name "<pipeline_name>" from searched results on Pipelines page
   Then user navigates to Pipeline Details page with header name as "<pipeline_name>"
   And user is able to see Details, YAML, Pipeline Runs, Parameters and Resources tabs
   And Details tab should contains fields like "Name", "Namespace", "Labels", "Annotations", "Created At", "Owner" and "Tasks"
   And Actions menu should display with following options "Start", "Add Trigger", "Remove Trigger", "Edit Pipeline", "Delete Pipeline"

Examples:
| pipeline_name |
| pipelines-one |

@regression, @smoke
Scenario Outline: Edit the Pipeline from pipelines Details page : P-08-TC01
   Given user is on pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user searches with pipeline name "<pipeline_name>" on Pipelines page
   And click pipeline name "<pipeline_name>" from searched results on Pipelines page
   And user selects the option "Edit Pipeline" from Actions menu drop down
   Then user navigates to Pipeline Builder page
   And "<pipeline_name>" field should be disabled
   And "Add Parameters" link, "Add Resources" link, "Task"  should be enabled

Examples:
| pipeline_name |
| pipelines-one |

@regression
Scenario Outline: Delete the Pipeline from pipelines Details page
   Given user is on pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user searches with pipeline name "<pipeline_name>" on Pipelines page
   And click pipeline name "<pipeline_name>" from searched results on Pipelines page
   And user selects the option "Delete Pipeline" from Actions menu drop down
   And click "Delete" button on "Delete Pipeline?" popup
   Then user navigates to Pipelines page
   But "<pipeline_name>" should not be displayed on Pipelines page

Examples:
| pipeline_name |
| pipelines-one |

@regression
Scenario Outline: Delete the Pipeline from pipelines page

@regression
Scenario Outline: Edit the Pipeline from pipelines page

@regression
Scenario Outline: Add the trigger to the pipeline from pipelines page

@regression
Scenario Outline: Remove the trigger to the pipeline from pipelines page

@smoke, @regression
Scenario Outline: Start the pipeline in Pipeline Details page


