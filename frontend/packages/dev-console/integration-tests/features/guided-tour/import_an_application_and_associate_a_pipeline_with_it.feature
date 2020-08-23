Feature: Import an application and associate a pipeline with it tour
	As a user, I want to take a guided tour of import an application and associate a pipeline with it feature   

Background:
    Given user is in developer perspective

@regression
Scenario: Starting tour from the +Add page 
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Import an application and associate a pipeline with it" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from Git" step is started
   And user sees steps to create an application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application was successfully created
   And user selects Yes option
   And user clicks on next
   And user sees next step "Explore your application" started
   And user sees steps as Let's explore your application in topology
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the application has been created an a pipeline was associated 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Start and explore your pipeline run" started 
   And user sees steps as You’ve just explored the topology of your application and seen it’s related resources. Now let’s start your pipeline
   And user clicks on next
   And user sees an alert appears "Check your work" asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started 
   And user selects Yes option
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees "Close", "Back" and "View all tours"
   And user clicks "View all tours" button to see all tour options in background
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Import an application and associate a pipeline with it card

@regression
Scenario: Starting tour from the Quick Starts page 
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Import an application and associate a pipeline with it card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from Git" step is started
   And user sees steps to create an application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application was successfully created
   And user selects Yes option
   And user clicks on next
   And user sees next step "Explore your application" started
   And user sees steps as Let's explore your application in topology
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the application has been created an a pipeline was associated 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Start and explore your pipeline run" started 
   And user sees steps as You’ve just explored the topology of your application and seen it’s related resources. Now let’s start your pipeline
   And user clicks on next
   And user sees an alert appears "Check your work" asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started 
   And user selects Yes option
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees "Close", "Back" and "View all tours"
   And user clicks "View all tours" button to see all tour options in background
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Import an application and associate a pipeline with it card

@regression
Scenario: Trying No option during the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Import an application and associate a pipeline with it" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from Git" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects No option
   Then user sees that the alert is saying "Try walking through the steps again to properly Create an application from Git"

@regression
Scenario: Avoiding option during the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Import an application and associate a pipeline with it card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from git" step is started
   And user sees steps to create an application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed 
   And user clicks on next
   And user sees next step "Explore your application" started
   And user sees steps as Let's explore your application in topology
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the application has been created an a pipeline was associated 
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close" and "Back"
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Import an application and associate a pipeline with it card

@regression
Scenario: Review the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user clicks on the "Start the tour" link on the Import an application and associate a pipeline with it card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from git" step is started
   And user sees steps to create an application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed 
   And user clicks on next
   And user sees next step "Explore your application" started
   And user sees steps as Let's explore your application in topology
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the application has been created an a pipeline was associated 
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close" and "Back"
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Import an application and associate a pipeline with it card

@regression
Scenario: Stopping and again resuming the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Import an application and associate a pipeline with it card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from git" step is started
   And user sees steps to create an application
   And user closes the close button
   And user sees modal "Are you sure you want to leave the tour"
   And user clicks on Leave button
   And user sees Resume the tour and Restart the tour button on bottom Import an application and associate a pipeline with it card
   And user clicks on Resume the tour
   Then user sees the tour will start from the step "Create an application from git"

@regression
Scenario: Stopping and restarting the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user clicks on the "Start the tour" link on the Import an application and associate a pipeline with it card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on the Start tour option
   And user sees "Create an application from git" step is started
   And user sees steps to create an application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed 
   And user closes the close button
   And user sees modal "Are you sure you want to leave the tour"
   And user clicks on Leave button
   And user sees Resume the tour and Restart the tour button on bottom of Import an application and associate a pipeline with it card
   And user clicks on the Restart the tour button
   Then user sees that the tour has started again

@regression
Scenario: Navigating between steps in the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Import an application and associate a pipeline with it" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to three steps present in the card
   And user clicks on third step "Start and explore your pipeline run"
   And user sees steps as You’ve just explored the topology of your application and seen it’s related resources. Now let’s start your pipeline
   And user clicks on next
   And user sees an alert appears "Check your work" asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started 
   And user clicks on second step "Explore your application"
   And user sees steps as Let's explore your application in topology
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the application has been created an a pipeline was associated 
   And user clicks on first step "Create an application from git" step is started
   And user sees steps to create an application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application was successfully created
   And user clicks on next
   And user sees step "Explore your application" with Check your work alert
   And user clicks on next
   And user sees step "Start and explore your pipeline run" with Check your work alert
   And user clicks on next
   Then user sees the security alert appearing on top saying "This tour has already been completed"
