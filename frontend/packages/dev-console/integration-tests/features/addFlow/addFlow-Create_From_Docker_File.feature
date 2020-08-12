Feature: Create Application from Docker file
    As a user I want to create the application, component or service from Add Flow Docker file

Background:
    Given user is at dev perspecitve
    And open project namespace "aut-addflow-docker"
    And user is at Add page


@regression
Scenario Outline: Dockerfile details after entering git repo url: A-06-TC01
   Given user is on Import from Docker file page
   When user types Git Repo url as "<docker_git_url>"
   Then git url gets Validated
   And Application name displays as "<app_name>"
   And Name displays as "<name>"

Examples:
| docker_git_url                           | app_name           | name           |
| https://github.com/sclorg/dancer-ex.git  | dancer-ex-git-app  | dancer-ex-git  |
| https://github.com/sclorg/cakephp-ex.git | cakephp-ex-git-app | cakephp-ex-git |


@regression, @smoke
Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type : A-06-TC03, A-06-TC04
   Given user is on Import from Docker file page
   When user type docker git url as "<docker_git_url>"
   And select "<resource_type>" radio button in Resoruce type section
   And click Create button on Add page   
   Then user redirects to Topology page
   And created workload "<name>" is present in topology page

Examples:
| docker_git_url                          | resource_type     | name          |
| https://github.com/sclorg/nodejs-ex.git | Deployment        | nodejs-ex-git |
| https://github.com/sclorg/nginx-ex.git  | Deployment Config | nginx-ex-git  |


@regression
Scenario: Perform cancel operation on Dockerfile form should redirects the user to Add page : A-06-TC02
   Given user is on Import from Docker file page
   When user type docker git url as "https://github.com/sclorg/nodejs-ex.git"
   And select "Deployment" radio button in Resoruce type section
   And click Cancel button on Add page   
   Then user redirects to Add page
