Feature: Create a workload of 'knative Service' type resource
    As a user, I want to create workload from Add Flow page

Background:
   Given user has installed Openshift Serverless operator
   And user is at developer perspecitve
   And user has selected namespace "aut-create-knative-workload"


@regression, @smoke
Scenario: knative resource type in git import add flow : Kn-01-TC03
   Given user is at Add page
   When user clicks on From git card
   Then user will be redirected to page with header name "Import from Git"
   And Knative Service option is displayed under Resources section


@regression
Scenario: knative resource type in container image add flow : Kn-01-TC04
   Given user is at Add page
   When user clicks on Container Image card
   Then user will be redirected to page with header name "Deploy Image"
   And Knative Service option is displayed under Resources section


@regression
Scenario: knative resource type in docke file add flow : Kn-01-TC05
   Given user is at Add page
   When user clicks on From Dockerfile card
   Then user will be redirected to page with header name "Import from Dockerfile"
   And Knative Service option is displayed under Resources section


@regression
Scenario: knative resource type in catalog add flow : Kn-01-TC06
   Given user is at Add page
   When user clicks on From Catalog card
   And create the application with s2i builder image 
   Then user will be redirected to page with header name "Create Source-to-Image Application"
   And Knative Service option is displayed under Resources section


@regression, @smoke
Scenario Outline: Create knative work load from From Git card on Add page : Kn-02-TC01
   Given user is on "<form_name>" form
   When user enters Git Repo url as "<git_url>"
   And user enters name as "<workload_name>"
   And user selects "knative" radio button on Add page
   And user clicks Create button on Add page
   Then user will be redirected to Topology page
   And user is able to see workload "<workload_name>" in topology page list view

Examples:
| form_name | header_name     | git_url                                 | workload_name |
| Git       | Import from Git | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git |


@regression
Scenario Outline: Create knative workload from Container image card on Add page : 
   Given user is on "<form_name>" form
   When user type "<image_name>" into the Image name from External registry text box
   And user enters name as "<workload_name>"
   And user selects "knative" radio button on Add page
   And user clicks Create button on Add page
   Then user will be redirected to Topology page
   And user is able to see workload "<workload_name>" in topology page list view

Examples:
| form_name       | header_name  | image_name                | workload_name |
| Container Image | Deploy Image | openshift/hello-openshift |               |


@regression
Scenario Outline: Create a workload from Docker file card on Add page :Kn-01-TC03
   Given user is on "<form_name>" form
   When user enters Git Repo url as "<docker_git_url>"
   And user selects resource type as "Knative Service"
   And user clicks Create button on Add page   
   Then user will be redirected to Topology page
   And user is able to see workload "<workload_name>" in topology page list view

Examples:
| form_name   | header_name             | docker_git_url            | workload_name | 
| Docker file | Import from Docker file | openshift/hello-openshift |               |


@regression
Scenario: Create a workload from DevCatalog BuilderImages card on Add page : Kn-01-TC04
   Given user is on "Catalog file" form
   And builder images are displayed
   When user searches and selects the "node" card
   And user creates the application with the selected builder image
   And user enters Git Repo url as "https://github.com/sclorg/nodejs-ex.git"
   And user selects resource type as "Knative Service"
   And user clicks Create button on Add page  
   Then user will be redirected to Topology page
   And user is able to see workload "nodejs-ex-git" in topology page list view
   