Feature: Creating a Serverless application tour
	As a user, I want to take a guided tour of creating a serverless application feature   

Background:
    Given user is in developer perspective

@regression
Scenario: Starting tour from the +Add page 
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Creating a Serverless application" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Demo scalability" started
   And user sees steps to see your application scale
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Wire an event source to your Knative Service" started 
   And user sees steps to wire an event source to your Knative Service
   And user clicks on next
   And user sees an alert appears "Check your work" asking to wire an event source to your Knative Service successfully 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Force a new revision & set traffic distribution" started
   And user sees steps to force a new revision & set traffic distribution
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that you forced a new revision & set traffic distribution successfully 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Delete your application" started
   And user sees steps to delete your application you just created
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user selects Yes option
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Knative Cookbook link
   And user sees "Close", "Back" and "View all tours"
   And user clicks "View all tours" button to see all tour options in background
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Creating a Serverless application card

@regression
Scenario: Starting tour from the Quick Starts page 
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Creating a Serverless application card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Demo scalability" started
   And user sees steps to see your application scale
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Wire an event source to your Knative Service" started 
   And user sees steps to wire an event source to your Knative Service
   And user clicks on next
   And user sees an alert appears "Check your work" asking to wire an event source to your Knative Service successfully 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Force a new revision & set traffic distribution" started
   And user sees steps to force a new revision & set traffic distribution
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that you forced a new revision & set traffic distribution successfully 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Delete your application" started
   And user sees steps to delete your application you just created
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user selects Yes option
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Knative Cookbook link
   And user sees "Close", "Back" and "View all tours"
   And user clicks "View all tours" button to see all tour options in background
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Creating a Serverless application card

@regression @manual
Scenario: Trying 'No' option during the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Creating a Serverless application" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects No option
   Then user sees that the alert is saying "Try walking through the steps again to properly install Serverless Operator"

@regression @manual
Scenario: Avoiding option during the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Creating a Serverless application card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user clicks on next
   And user sees next step "Demo scalability" started
   And user sees steps to see your application scale
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close" and "Back"
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Creating a Serverless application card


@regression @manual
Scenario: Review the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user clicks on the "Start the tour" link on the Creating a Serverless application card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user clicks on next
   And user sees next step "Demo scalability" started
   And user sees steps to see your application scale
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close" and "Back"
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Creating a Serverless application card

@regression
Scenario: Stopping and again resuming the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Creating a Serverless application card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user closes the close button
   And user sees modal "Are you sure you want to leave the tour"
   And user clicks on Leave button
   And user sees Resume the tour and Restart the tour button on bottom Creating a Serverless application card
   And user clicks on Resume the tour
   Then user sees the tour will start from the step "Create a Serverless application"

@regression
Scenario: Stopping and restarting the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user clicks on the "Start the tour" link on the Creating a Serverless application card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on the Start tour option
   And user sees "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user closes the close button
   And user sees modal "Are you sure you want to leave the tour"
   And user clicks on Leave button
   And user sees Resume the tour and Restart the tour button on bottom of Creating a Serverless application card
   And user clicks on the Restart the tour button
   Then user sees that the tour has started again

@regression
Scenario: Navigating between steps in the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Import an application and associate a pipeline with it" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to five steps present in the card
   And user clicks on fifth step "Delete your application" started
   And user sees steps to delete your application you just created
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully
   And user clicks on fourth step "Force a new revision & set traffic distribution" started
   And user sees steps to force a new revision & set traffic distribution
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that you forced a new revision & set traffic distribution successfully 
   And user clicks on third step "Wire an event source to your Knative Service" started 
   And user sees steps to wire an event source to your Knative Service
   And user clicks on next
   And user sees an alert appears "Check your work" asking to wire an event source to your Knative Service successfully 
   And user clicks on second step "Demo scalability" started
   And user sees steps to see your application scale
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that your application scaled successfully 
   And user clicks on first step "Create a Serverless application" step is started
   And user sees steps to create an Serverless application
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user clicks on next
   And user sees step "Demo scalability" with Check your work alert
   And user clicks on next
   And user sees step "Wire an event source to your Knative Service" with Check your work alert
   And user clicks on next
   And user sees step "Force a new revision & set traffic distribution" with Check your work alert
   And user clicks on next
   And user sees step "Delete your application" with Check your work alert
   And user clicks on next
   Then user sees the security alert appearing on top saying "This tour has already been completed"
