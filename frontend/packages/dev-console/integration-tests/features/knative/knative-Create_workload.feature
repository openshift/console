Feature: Create a workload of 'Knative Service' type resource
    As a user I want to create workload from Add Flow page

Background:
   Given open shift cluster is installed with Serverless operator
   And user is on dev perspective +Add page
   And create the project "aut-create-knative-worload"


@regression, @smoke
Scenario: Knative resource type in git import add flow : Kn-01-TC03
   Given user is on Add flow page
   When user clicks on "From git" card
   Then user redirects to page with header name "Import from git"
   And Knaive Service option is displayed in Resources section


@regression
Scenario: Knative resource type in container image add flow : Kn-01-TC04
   Given user is on Add flow page
   When user clicks on "Container Image" card
   Then user redirects to page with header name "Deploy Image"
   And Knaive Service option is displayed in Resources section


@regression
Scenario: Knative resource type in docke file add flow : Kn-01-TC05
   Given user is on Add flow page
   When user clicks on "From Dockerfile" card
   Then user redirects to page with header name "Import from Dockerfile"
   And Knaive Service option is displayed in Resources section


@regression
Scenario: Knative resource type in catalog add flow : Kn-01-TC06
   Given user is on Add flow page
   When user clicks on "From Catalog" card
   And create the application with s2i builder image 
   Then user redirects to page with header name "Create Source-to-Image Application"
   And Knaive Service option is displayed in Resources section


@regression, @smoke
Scenario Outline: Create a work load from From Git card on Add page : Kn-02-TC01
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<git_url>" into the "Git Repo url" text box
   And select "Kantive Service" radio button on Add page
   And click "Create" button on Add page
   Then user redirects to Topology page
   And created workload is present in List View of topology page

Examples:
| form_name | header_name     | git_url                                 | 
| git       | Import from git | https://github.com/sclorg/nodejs-ex.git |


@regression
Scenario Outline: Create a workload from Container image card on Add page : Kn-01-TC02
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<image_name>" into the "Image name from External registry" text box
   And select "Kantive Service" radio button on Add page
   And click "Create" button on Add page
   Then user redirects to Topology page
   And created workload is present in List View of topology page

Examples:
| form_name       | header_name  | image_name                | 
| Container Image | Deploy Image | openshift/hello-openshift |


@regression
Scenario Outline: Create a workload from Docker file card on Add page :Kn-01-TC03
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<docker_git_url>" into the "Git Repo url" text box
   And select "Kantive Service" radio button on Add page
   And click "Create" button on Add page   
   Then user redirects to Topology page
   And created workload is present in List View of topology page

Examples:
| form_name   | header_name             | docker_git_url            | 
| Docker file | Import from Docker file | openshift/hello-openshift |


@regression
Scenario: Create a workload from DevCatalog BuilderImages card on Add page : Kn-01-TC04
   Given user is on "Catalog file" form with header name "user Catalog"
   And builder images are displayed
   When user search and select the "node" card
   And create the application with the selected builder image
   And user type "https://github.com/sclorg/nodejs-ex.git" into the "Git Repo url" text box
   And select the "Kantive Service" radio button on Add page
   And click "Create" button on Add page  
   Then user redirects to Topology page
   And created workload is present in List View of topology page
   