Feature: Create Application from git form
    As a user I want to create the application, component or service from Add options

Background:
    Given user is at dev perspecitve
    And user is at Add page
    And open project namespace "aut-addflow-git"

@regression
Scenario Outline: Builder iamge display for git url "<git_url>" : A-04-TC01
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   Then git url gets Validated
   And builder image is detetced
   And builder image version drop down is displayed
   And Application name displays as "<app_name>"
   And Name displays as "<name>"

Examples:
| git_url                                                   | app_name                  | name                  |
| https://github.com/sclorg/dancer-ex.git                   | dancer-ex-git-app         | dancer-ex-git         |
| https://github.com/sclorg/cakephp-ex.git                  | cakephp-ex-git-app        | cakephp-ex-git        |
| https://github.com/sclorg/nginx-ex.git                    | nginx-ex-git-app          | nginx-ex-git          |
| https://github.com/sclorg/httpd-ex.git                    | httpd-ex-git-app          | httpd-ex-git          |  
| https://github.com/redhat-developer/s2i-dotnetcore-ex.git | s2i-dotnetcore-ex-git-app | s2i-dotnetcore-ex-git |
| https://github.com/sclorg/golang-ex.git                   | golang-ex-git-app         | golang-ex-git         | 
| https://github.com/sclorg/ruby-ex.git                     | ruby-ex-git-app           | ruby-ex-git           |
| https://github.com/sclorg/django-ex.git                   | django-ex-git-app         | django-ex-git         |
| https://github.com/jboss-openshift/openshift-quickstarts  | openshift-quickstarts-app | openshift-quickstarts |
| https://github.com/sclorg/nodejs-ex.git                   | nodejs-ex-git-app         | nodejs-ex-git         |


@regression, @smoke
Scenario Outline: Add new git workload with new application for resoruce type "<resource_type>" : A-04-TC02, A-04-TC13
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And selects "<resource_type>" resource type
   And clicks Create button on Add page 
   Then user redirects to Topology page
   And created workload "<name>" is present in topology page

Examples:
| git_url                                  | app_name           | name           | resource_type     |
| https://github.com/sclorg/dancer-ex.git  | dancer-ex-git-app  | dancer-ex-git  | Deployment        |
| https://github.com/sclorg/cakephp-ex.git | cakephp-ex-git-app | cakephp-ex-git | Deployment Config |


@regression
Scenario: Add new git workload to the existing application : A-04-TC03
   Given user is at Import from git page
   When user types Git Repo url as "https://github.com/sclorg/nodejs-ex.git"
   And selects "deployment config" resource type
   And clicks Create button on Add page
   Then user redirects to Topology page
   And created workload is linked to existing application


@regression
Scenario: Cancel the git workload creation : A-04-TC04
   Given user is at Import from git page
   When user types Git Repo url as "https://github.com/sclorg/dancer-ex.git"
   And clicks "Cancel" button on Add page 
   Then user redirects to Add page


@regression
Scenario: Create workload without application route : A-04-TC05
   Given user is at Import from git page
   When user types Git Repo url as "https://github.com/sclorg/dancer-ex.git"
   And types Application name as "app-with-no-app-route"
   And types Name as "node-with-no-app-route"
   And unselect the advanced option "Create a route to the application"
   And clicks Create button on Add page 
   Then user redirects to Topology page
   And public url is not created for node "node-with-no-app-route"


@regression
Scenario Outline: Create a git workload with advanced option "Routing" : A-04-TC06
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And type name as "<name>" in General section
   And click "Routing" link in Advanced Options section
   And type Hostname as "<hostname>"
   And type Path as "<path>"
   And select Target Port as "8080 -> 8080 (TCP)"
   And click Create button on Add page
   Then user redirects to Topology page
   And the route of application contains "<hostname>"

Examples:
| git_url                                 | hostname | path  | name            |
| https://github.com/sclorg/nodejs-ex.git | home     | /home | nodejs-ex.git-1 |


@regression
Scenario Outline: Creaete the workload by unselecting options in "Build Configuration" section: A-04-TC07
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And user types name as "<name>" in General section
   And clicks "Build Configuration" link in Advanced Options section
   And unselects "Configure a webhook build trigger" checkbox in build configuration section
   And unselects "Automatically build a new image when the builder image changes" checkbox in build configuration section
   And unselects "Launch the first build when the build configuration is created" checkbox in build configuration section
   And type Name as "<name>" in Environment Variables (Build and Runtime) section
   And type Value as "<value>" in Environment Variables (Build and Runtime) section
   And click Create button on Add page
   Then user redirects to Topology page
   And build does not get started

Examples:
| git_url                                 | name | value | name            |
| https://github.com/sclorg/nodejs-ex.git | home | value | nodejs-ex.git-2 |


@regression
Scenario Outline: Create a git workload with advanced option "Deployment" : A-04-TC08
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And type name as "<name>" in General section
   And click "Deployment" link in Advanced Options section
   And verify "Auto deploy when new image is available" checkbox is seleceted
   And type Name as "<name>" in Environment Variables (Runtime only) section
   And type Value as "<value>" in Environment Variables (Runtime only) section
   And click Create button on Add page
   Then user redirects to Topology page

Examples:
| git_url                                 | name | value | name            |
| https://github.com/sclorg/nodejs-ex.git | home | value | nodejs-ex.git-3 |


@regression
Scenario Outline: Create a git workload with advanced option "Resource Limits" : A-04-TC09
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And type name as "<name>" in General section
   And click "Resource Limits" link in Advanced Options section
   And type CPU Request as "<cpu_request>" in CPU section
   And type CPU Limits as "<cpu_limit>" in CPU section
   And type Memory Request as "<memory_request>" in Memory section
   And type Memory Limit as "<memory_limit>" in Memory section
   And click Create button on Add page
   Then user redirects to Topology page

Examples:
| git_url                                 | cpu_request | cpu_limit | memory_request | memory_limit | name            |
| https://github.com/sclorg/nodejs-ex.git | 10          | 12        | 200            | 300          | nodejs-ex.git-4 |


@regression
Scenario Outline: Create a git workload with advanced option "Scaling" : A-04-TC10
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And type name as "<name>" in General section
   And click "Scaling" link in Advanced Options section
   And type number of replicas as "<replica_set_value>" in Replicas section
   And click Create button on Add page
   Then user redirects to Topology page

Examples:
| git_url                                 | replica_set_value | name            |
| https://github.com/sclorg/nodejs-ex.git | 5                 | nodejs-ex.git-5 |


@regression
Scenario Outline: Create a git workload with advanced option "Labels" : A-04-TC11
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And type name as "<name>" in General section
   And click "Labels" link in Advanced Options section
   And type label as "<label_name>"
   And click Create button on Add page
   Then user redirects to Topology page
   And verify the label in application node side pane

Examples:
| git_url                                 | label_name   | name            |
| https://github.com/sclorg/nodejs-ex.git | app=frontend | nodejs-ex.git-6 |


@regression
Scenario: Create a git workload with advanced option "Health Checks" : A-04-TC12
   Given user is at Import from git page
   When user types Git Repo url as "<git_url>"
   And type name as "<name>" in General section
   And click "Health Checks" link in Advanced Options section
   And fill the Readiness Probe details
   And fill the Liveness Probe details
   And fill the Startup Probe details
   And click Create button on Add page
   Then user redirects to Topology page

Examples:
| git_url                                 | label_name   | name            |
| https://github.com/sclorg/nodejs-ex.git | app=frontend | nodejs-ex.git-7 |   
