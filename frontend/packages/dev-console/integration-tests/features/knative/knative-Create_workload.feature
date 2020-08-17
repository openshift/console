Feature: Create a workload of 'Knative Service' type resource
    As a user I want to create workload from Add Flow page

Background:
   Given open shift cluster is installed with Serverless operator
   And user is at Developer Perspective
   And open project namespace "aut-create-knative-workload"


@regression, @smoke
Scenario: Knative resource type in git import add flow : Kn-01-TC03
   Given user is at Add page
   When user clicks on From git card
   Then user redirects to page with header name "Import from git"
   And Knaive Service option is displayed in Resources section


@regression
Scenario: Knative resource type in container image add flow : Kn-01-TC04
   Given user is at Add page
   When user clicks on Container Image card
   Then user redirects to page with header name "Deploy Image"
   And Knaive Service option is displayed in Resources section


@regression
Scenario: Knative resource type in docke file add flow : Kn-01-TC05
   Given user is at Add page
   When user clicks on From Dockerfile card
   Then user redirects to page with header name "Import from Dockerfile"
   And Knaive Service option is displayed in Resources section


@regression
Scenario: Knative resource type in catalog add flow : Kn-01-TC06
   Given user is at Add page
   When user clicks on From Catalog card
   And create the application with s2i builder image 
   Then user redirects to page with header name "Create Source-to-Image Application"
   And Knaive Service option is displayed in Resources section


@regression, @smoke
Scenario Outline: Create knative work load from From Git card on Add page : Kn-02-TC01
   Given user is on "<form_name>" form
   When user type "<git_url>" into the Git Repo url text box
   And type name as "<workload_name>"
   And select "Kantive" radio button on Add page
   And click Create button on Add page
   Then user redirects to Topology page
   And created workload "<workload_name>" is present in List View of topology page

Examples:
| form_name | header_name     | git_url                                 | workload_name |
| Git       | Import from git | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git |


@regression
Scenario Outline: Create knative workload from Container image card on Add page : 
   Given user is on "<form_name>" form
   When user type "<image_name>" into the Image name from External registry text box
   And type name as "<workload_name>"
   And select "Kantive" radio button on Add page
   And click Create button on Add page
   Then user redirects to Topology page
   And created workload "<workload_name>" is present in List View of topology page

Examples:
| form_name       | header_name  | image_name                | workload_name |
| Container Image | Deploy Image | openshift/hello-openshift |               |


@regression
Scenario Outline: Create a workload from Docker file card on Add page :Kn-01-TC03
   Given user is on "<form_name>" form
   When user type "<docker_git_url>" into the Git Repo url text box
   And select "Kantive" radio button on Add page
   And click Create button on Add page   
   Then user redirects to Topology page
   And created workload "<workload_name>" is present in List View of topology page

Examples:
| form_name   | header_name             | docker_git_url            | workload_name | 
| Docker file | Import from Docker file | openshift/hello-openshift |               |


@regression
Scenario: Create a workload from DevCatalog BuilderImages card on Add page : Kn-01-TC04
   Given user is on "Catalog file" form
   And builder images are displayed
   When user search and select the "node" card
   And create the application with the selected builder image
   And user type "https://github.com/sclorg/nodejs-ex.git" into the Git Repo url text box
   And select the resource type "Knative" radio button on Add page
   And click Create button on Add page  
   Then user redirects to Topology page
   And created workload "nodejs-ex-git" is present in List View of topology page
   