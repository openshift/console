Feature: Create Application from +Add page
    As a user I want to create the application, component or service from Add options

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve
    And user is on a project namespace "AUT_MB_Demo"

@regression
Scenario Outline: Verify the Builder iamge detection for all workloads
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   Then "Validated" message should be displayed
   And "Builder image(s) detected" message should be displayed under Builder Section
   And Builder image version drop down should get selected
   And Application name should display as "<app_name>"
   And Name should display as "<name>"

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
Scenario Outline: Add new git workload with new application
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   Then "Validated" message should be displayed
   And "Builder image(s) detected" message should be displayed under Builder Section
   And Builder image version drop down should get selected
   And Application name should display as "<app_name>"
   And Name should display as "<name>"
   When user selects "<resource_type>" radio button in Resources section
   And click "Create" button on Add page 
   Then user navigates to topology page
   And created workload is present in topology page
   And pipeline name is displayed in side pane for created node

Examples:
| git_url                                 | resource_type | app_name          | name          |
| https://github.com/sclorg/dancer-ex.git | Deployment    | dancer-ex.git-app | dancer-ex.git |


@regression
Scenario Outline: Add new git workload to the existing application
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   Then "Validated" message should be displayed
   And "Builder image(s) detected" message should be displayed under Builder Section
   And Builder image version drop down should get selected
   And Application name dropdown displayed with selected option "<app_name>"
   And Application name dropdown should contain option as "Create Application"
   And Name should display as "<name>"
   When user select "<resource_type>" radio button in Resources section
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present with in the existing application of topology page

Examples:
| git_url                                 | resource_type | app_name          | name          |
| https://github.com/sclorg/nodejs-ex.git | Deployment    | nodejs-ex.git-app | nodejs-ex.git |


@regression
Scenario Outline: Create a git workload with advanced option "Routing"
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And click "Routing" link in Advanced Options section
   And type Hostname as "<hostname>"
   And type Path as "<path>"
   And select Target Port as "8080 -> 8080 (TCP)"
   And click "Create" button on Add page
   Then user navigates to topology page
   And verify the route of the node contains "<hostname>"

Examples:
| git_url                                 | hostname | path  | name            |
| https://github.com/sclorg/nodejs-ex.git | home     | /home | nodejs-ex.git-1 |

@regression
Scenario Outline: Create a git workload with advanced option "Build Configuration" [TBD - Then]
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And click "Build Configuration" link in Advanced Options section
   And verify "Configure a webhook build trigger" checkbox is seleceted
   And verify "Automatically build a new image when the builder image changes" checkbox is selected
   And verify "Launch the first build when the build configuration is created" checkbox is selected
   And type Name as "<name>" in Environment Variables (Build and Runtime) section
   And type Value as "<value>" in Environment Variables (Build and Runtime) section
   And click "Create" button on Add page
   Then user navigates to topology page

Examples:
| git_url                                 | name | value | name            |
| https://github.com/sclorg/nodejs-ex.git | home | value | nodejs-ex.git-2 |

@regression
Scenario Outline: Create a git workload with advanced option "Deployment" [TBD - Then]
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And click "Deployment" link in Advanced Options section
   And verify "Auto deploy when new image is available" checkbox is seleceted
   And type Name as "<name>" in Environment Variables (Runtime only) section
   And type Value as "<value>" in Environment Variables (Runtime only) section
   And click "Create" button on Add page
   Then user navigates to topology page

Examples:
| git_url                                 | name | value | name            |
| https://github.com/sclorg/nodejs-ex.git | home | value | nodejs-ex.git-3 |

@regression
Scenario Outline: Create a git workload with advanced option "Resource Limits" [TBD - Then]
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And click "Resource Limits" link in Advanced Options section
   And type CPU Request as "<cpu_request>" in CPU section
   And type CPU Limits as "<cpu_limit>" in CPU section
   And type Memory Request as "<memory_request>" in Memory section
   And type Memory Limit as "<memory_limit>" in Memory section
   And click "Create" button on Add page
   Then user navigates to topology page

Examples:
| git_url                                 | cpu_request | cpu_limit | memory_request | memory_limit | name            |
| https://github.com/sclorg/nodejs-ex.git | 10          | 12        | 200            | 300          | nodejs-ex.git-3 |

@regression
Scenario Outline: Create a git workload with advanced option "Scaling" [TBD - Then]
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And click "Scaling" link in Advanced Options section
   And type number of replicas as "<replica_set_value>" in Replicas section
   And click "Create" button on Add page
   Then user navigates to topology page

Examples:
| git_url                                 | replica_set_value | name            |
| https://github.com/sclorg/nodejs-ex.git | 5                 | nodejs-ex.git-4 |

@regression
Scenario Outline: Create a git workload with advanced option "Labels"
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And click "Labels" link in Advanced Options section
   And type label as "<label_name>"
   And click "Create" button on Add page
   Then user navigates to topology page
   And verify the label in application node side pane

Examples:
| git_url                                 | label_name   | name            |
| https://github.com/sclorg/nodejs-ex.git | app=frontend | nodejs-ex.git-5 |

@smoke
Scenario Outline: Create a git workload
   Given user is on "git" form with header name "Import from git"
   When user type "Git Repo url" as "<git_url>"
   And type name as "<name>" in General section
   And select "<resource_type>" radio button in Resources section
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present in topology page

Examples:
| git_url                                 | resource_type | name            |
| https://github.com/sclorg/dancer-ex.git | Deployment    | nodejs-ex.git-6 |