Feature: Create a workload of 'Knative Service' type resource
    As a user I want to create workload from Add Flow page

Background:
   Given open shift cluster is installed with Serverless operator
   And create the project 
   And user is on dev perspective +Add page

@regression
Scenario Outline: Create a work load from From Git card on Add page
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<git_url>" into the "Git Repo url" text box
   And select "Kantive Service" radio button on Add page
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present in List View of topology page

Examples:
| form_name | header_name     | git_url                                 | 
| git       | Import from git | https://github.com/sclorg/nodejs-ex.git |

@regression
Scenario Outline: Create a workload from Container image card on Add page
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<image_name>" into the "Image name from External registry" text box
   And select "Kantive Service" radio button on Add page
   And click "Create" button on Add page
   Then user navigates to topology page
   And created workload is present in List View of topology page

Examples:
| form_name       | header_name  | image_name                | 
| Container Image | Deploy Image | openshift/hello-openshift |

@regression
Scenario Outline: Create a workload from Docker file card on Add page
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<docker_git_url>" into the "Git Repo url" text box
   And select "Kantive Service" radio button on Add page
   And click "Create" button on Add page   
   Then user navigates to topology page
   And created workload is present in List View of topology page

Examples:
| form_name   | header_name             | docker_git_url            | 
| Docker file | Import from Docker file | openshift/hello-openshift |

@regression
Scenario: Create a workload from DevCatalog BuilderImages card on Add page
   Given user is on "Catalog file" form with header name "user Catalog"
   And builder images are displayed
   When user search and select the "node" card
   And create the application with the selected builder image
   And user type "https://github.com/sclorg/nodejs-ex.git" into the "Git Repo url" text box
   And select the "Kantive Service" radio button on Add page
   And click "Create" button on Add page  
   Then user navigates to topology page
   And created workload is present in List View of topology page
   