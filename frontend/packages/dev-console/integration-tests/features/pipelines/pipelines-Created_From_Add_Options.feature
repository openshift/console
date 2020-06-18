Feature: Create Pipeline from Add Options
    As a user I want to view pipeline, create, edit and delete the pipeline

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression
Scenario: From Git Page pipelines section: P-01-TC03
   Given user is at "Add" page
   When user clicks From Git card on the +Add page
   Then user navigates to page with header name Import from git
   And pipeline section is displayed with message "Select a builder image and resource to see if there is a pipeline template available for this runtime."


@regression
Scenario: From Dockerfile Page Pipelines section : P-01-TC04
   Given user is at "Add" page
   When user clicks From Dockerfile card on the +Add page
   Then user navigates to page with header name Import from git
   And Add pipeline section is displayed


@regression
Scenario Outline: Add Pipeline display in git workload for builder image : P-02-TC08
   Given user is at "Import from git" form
   When user type "Git Repo url" as "<git_url>"
   Then "Add pipeline" checkbox is displayed

Examples:
| git_url                                                   |
| https://github.com/sclorg/dancer-ex.git                   |
| https://github.com/sclorg/cakephp-ex.git                  |
| https://github.com/sclorg/nginx-ex.git                    |
| https://github.com/sclorg/httpd-ex.git                    |
| https://github.com/redhat-developer/s2i-dotnetcore-ex.git |
| https://github.com/sclorg/golang-ex.git                   |
| https://github.com/sclorg/ruby-ex.git                     |
| https://github.com/sclorg/django-ex.git                   |
| https://github.com/jboss-openshift/openshift-quickstarts  |
| https://github.com/sclorg/nodejs-ex.git                   |


@regression, @smoke
Scenario Outline: Create a pipeline from git workload with resource type "<resource>" : P-02-TC01, P-02-TC06
   Given user is at "Import from git" form
   When user type Git Repo url as "<git_url>"
   And type Name as "<name>" in General section
   And select "<resource>" radio button in Resources section
   And select "Add Pipeline" checkbox in Pipelines section
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present in topology page

Examples:
| git_url                                 | pipeline_name    | resource          | name             |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-D  | Deployment        | nodejs-ex.git-D  |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-DC | Deployment Config | nodejs-ex.git-DC |


@regression
Scenario Outline: Create a pipeline from git workload with knative resource type  : P-02-TC07
   Given cluster is installed with knative operator
   And user is at "Import from git" form
   When user type Git Repo url as "<git_url>"
   And type Name as "<name>" in General section
   And select "knative" radio button in Resources section
   And select "Add Pipeline" checkbox in Pipelines section
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present in topology page

Examples:
| git_url                                 | pipeline_name    | name             |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-Kn | nodejs-ex.git-Kn |


@regression, @smoke
Scenario Outline: Pipeline in topology page : P-02-TC02
   Given user is at "Topology" page
   And "<name>" component is added to namespace
   When the user enters "<name>" into the search bar
   And clicks node "<name>" from results
   Then side pane is displayed with pipeline name same as component name "<name>"

Examples:
| name            |
| nodejs-ex.git-D |

@regression, @smoke
Scenario Outline: Search the created pipeline from Add options in pipelines page : P-02-TC03
   Given user is at "Pipelines" page
   And "<name>" component is added to namespace
   When the user enters "<name>" into the search bar
   Then pipeline name is displayed with the component name "<name>"

Examples:
| name            |
| nodejs-ex.git-D |


@regression
Scenario Outline: Create a workload with pipeline from Docker file : P-02-TC04
   Given user is at "Import from Docker file" form
   When user type "Git Repo url" as "<docker_git_url>" 
   And select "Add Pipeline" checkbox in Pipelines section
   And clicks "Create" button on Add page   
   Then user redirects to the topology page
   And created workload is present in topology page

Examples:
| docker_git_url | 
|                |


Scenario Outline: Create a pipeline with s2i builder images : P-02-TC05
   Given user is at "Developer Catalog" form with builder images
   When the user enters "node" into the Builder Image search bar
   And create the application with the selected builder image
   And user type "Git Repo url" as "<git_url>" 
   And select "Add Pipeline" checkbox in Pipelines section
   And click "Create" button on Create Source-to-Image application
   Then user redirects to the topology page
   And created workload is present in topology page

Examples:
| git_url                                 | 
| https://github.com/sclorg/nodejs-ex.git |


@regression
Scenario: Pipelines section in topology page: P-02-TC09
   Given user is at "topology" page
   When the user enters "<node_name>" into the search bar
   And user clicks node on topology page
   Then right side pane opens in topology page
   And pipelines section is displayed
   And "Start LastRun" button is disabled

Examples:
| node_name       | 
| nodejs-ex.git-D |
