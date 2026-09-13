@e2e @mobile @authentication
# Feature code: 1
Feature: Mobile authentication
    The mobile client should support sign in, sign up, and password reset from a single auth screen.

    Background:
        Given the tester is using a simulator connected to an isolated Supabase test project
        And any accounts used are disposable fixtures

    # Scenario code: 1.1
    Scenario: Sign in with a valid account
        Given the tester is on the authentication screen in sign in mode
        When the tester enters a valid email address and password
        And the tester submits the form
        Then the app should open the authenticated workspace without showing an auth error alert

    # Scenario code: 1.2
    Scenario: Create an account in sign up mode
        Given the tester is on the authentication screen
        When the tester switches to sign up mode
        And the tester enters a new email address and matching passwords
        And the tester submits the form
        Then the app should honor the test project's email confirmation policy
        And after confirmation and sign in the account should be able to create synced tasks

    # Scenario code: 1.3
    Scenario: Send a password reset email
        Given the tester is on the authentication screen in sign in mode
        When the tester enters an existing account email address
        And the tester triggers the forgot password action
        Then the app should confirm that a reset link was sent
        And no unexpected auth error alert should remain visible

    # Scenario code: 1.4
    Scenario: Delete a disposable account from the drawer
        Given the tester signs up with a disposable mobile test account
        And the authenticated account has at least one synced task and saved preferences
        When the tester opens the drawer and taps Delete Account
        And the tester confirms the destructive account deletion alert
        Then the app should return to the device workspace without an account session
        And signing in again with the deleted account should fail
        And the Supabase project should no longer contain that user's tasks, preferences or planner items