#Sample AWS Lambda function for Alexa
A simple [AWS Lambda](http://aws.amazon.com/lambda) function that demonstrates how to write a skill for the Amazon Echo using the Alexa SDK.

## Concepts
This sample shows how to create a Lambda function for handling Alexa Skill requests that:

- Web service: communicate with an external web service to get calendar data from the [Google API](https://developers.google.com/google-apps/calendar/)
- Multiple optional slots: has 4 slots (reminder type, first name, last name, and date), where the user can provide 0, 1, 2, 3 or 4 values, and assumes defaults for the unprovided values
- DATE slot: demonstrates date handling and formatted date responses appropriate for speech
- Custom slot type: demonstrates using custom slot types to handle a finite set of known values
- Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
  If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
  examples section for sample interactions of these models.
- Pre-recorded audio: Uses the SSML 'audio' tag to include an ocean wave sound in the welcome response.

## Setup
To run this example skill you need to do three things. The first is to deploy the example code in lambda, the second is to configure the Alexa skill to use Lambda, and the third is to create Google API project with credentials of type OAuth client ID. .

### AWS Lambda Setup
1. Go to the AWS Console and click on the Lambda link. Note: ensure you are in us-east or you won't be able to use Alexa with Lambda.
2. Click on the Create a Lambda Function or Get Started Now button.
3. Skip the blueprint
4. Name the Lambda Function "Goole-Birthday-Reminder-Example-Skill".
5. Select the runtime as Node.js
6. Go to the the src directory, select all files and then create a zip file, make sure the zip file does not contain the src directory itself, otherwise Lambda function will not work.
7. Select Code entry type as "Upload a .ZIP file" and then upload the .zip file to the Lambda
8. Keep the Handler as index.handler (this refers to the main js file in the zip).
9. Create a basic execution role and click create.
10. Leave the Advanced settings as the defaults.
11. Click "Next" and review the settings then click "Create Function"
12. Click the "Event Sources" tab and select "Add event source"
13. Set the Event Source type as Alexa Skills kit and Enable it now. Click Submit.
14. Copy the ARN from the top right to be used later in the Alexa Skill Setup.

### Alexa Skill Setup
1. Go to the [Alexa Console](https://developer.amazon.com/edw/home.html) and click Add a New Skill.
2. Set "Google Birthday Reminder" for the skill name and "google birthday reminder" as the invocation name, this is what is used to activate your skill. For example you would say: "Alexa, Ask google birthday reminder when is birthday of John."
3. Select the Lambda ARN for the skill Endpoint and paste the ARN copied from above. Click Next.
4. Copy the custom slot types from the customSlotTypes folder. Each file in the folder represents a new custom slot type. The name of the file is the name of the custom slot type, and the values in the file are the values for the custom slot.
5. Copy the Intent Schema from the included IntentSchema.json.
6. Copy the Sample Utterances from the included SampleUtterances.txt. Click Next.
7. [optional] go back to account linking set-up and add Google API client details in addition to the [OAuth API end-point](https://accounts.google.com/o/oauth2/token) 

8. [optional] go back to the skill Information tab and copy the appId. Paste the appId into the index.js file for the variable APP_ID,
   then update the lambda source zip file with this change and upload to lambda again, this step makes sure the lambda function only serves request from authorized source.
9. You are now able to start testing your sample skill! You should be able to go to the [Echo webpage](http://echo.amazon.com/#skills) and see your skill enabled.
10. In order to test it, try to say some of the Sample Utterances from the Examples section below.
11. Your skill is now saved and once you are finished testing you can continue to publish your skill.

### Google API project Setup
1. Follow the [article](https://developers.google.com/identity/sign-in/web/devconsole-project) on creating new project with OAuth Client ID.
    1. Use scope https://www.googleapis.com/auth/calendar.readonly
    2. Use domain as specified in lambda.  
    3. Use redirect URL as specified in lambda. Redirect URL may look like https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=AAAAAAAAAAAAAA&state=xyz&code=SplxlOBeZQQYbYS6WxSbIA.

## Examples
Example user interactions:

### One-shot model:
    User:  "Alexa, ask Google Birthday Reminder when is the anniversary of John Snow"
    Alexa: "Saturday June 20th is the aniversary of John Snow ..."

### Dialog model:
    User:  "Alexa, open Google Birthday Reminder"
    Alexa: "Welcome to Google Birthday Reminder. What contact or date would you like reminders for?"
    User:  "John"
    Alexa: "John who?"
    User:  "Snow"
    Alexa: "Saturday June 20th is the aniversary of John Snow ..."
