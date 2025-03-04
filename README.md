# Leads Manager for Gmail

A powerful Gmail Add-on that transforms your inbox into a lightweight CRM system, allowing you to manage leads and track customer relationships without leaving your email.

## Features

- **Lead Management**: Create, edit and organize leads directly in Gmail
- **Email Linking**: Associate emails with specific leads for easy reference
- **Sales Pipeline Tracking**: Track lead status from New to Won/Lost
- **Context-Aware**: View and manage related leads when reading emails
- **Quick Actions**: Add leads with one click using the "Link to Lead" action
- **Smart Matching**: Automatically suggests leads based on email sender

## How It Works

Leads Manager for Gmail integrates seamlessly with your Gmail workflow:

1. **View Leads Dashboard**: Access your leads directly from the Gmail sidebar
2. **Create Leads**: Add new leads manually or directly from email conversations
3. **Link Emails**: Associate important conversations with specific leads
4. **Track Progress**: Update lead status as relationships develop
5. **Quick Access**: View a lead's entire communication history in one place

## Installation Instructions

### Option 1: Deploy as a Personal Add-on

1. **Create a new Google Apps Script project**:
   - Go to [Google Apps Script](https://script.google.com/home)
   - Click "+ New Project"
   - Delete any default code

2. **Add project files**:
   - Copy and paste each file from this repository into your project
   - Make sure to maintain the same filenames

3. **Configure the manifest**:
   - In the Apps Script editor, navigate to the `appsscript.json` file
   - Copy the content from the `appsscript.json` in this repository

4. **Deploy the Add-on**:
   - Click on "Deploy" > "New deployment"
   - Select "Gmail Add-on" as the deployment type
   - Click "Deploy"
   - Grant necessary permissions when prompted

5. **Use the Add-on**:
   - Refresh Gmail
   - Look for the Add-on icon in the right sidebar

### Option 2: Deploy for Your Organization

If you want to deploy this for your entire organization:

1. Follow steps 1-3 from Option 1
2. Click "Deploy" > "New deployment"
3. Select "Gmail Add-on" as the deployment type
4. Under "Who has access", select "Anyone within [your organization]"
5. Deploy and publish to your organization's Google Workspace Marketplace

### Option 3: Contribute to This Project

If you want to contribute to the development:

1. Fork this repository
2. Make your changes
3. Submit a pull request with a clear description of your improvements

## Customization

You can customize various aspects of the Leads Manager:

- **Lead Statuses**: Edit the `CONSTANTS.LEADS.STATUS` object in `constants.gs` to modify available statuses
- **UI Colors**: Change the colors in `CONSTANTS.UI.COLORS` to match your brand
- **Default Settings**: Modify the default settings in `AppCache.getLeadsSettings()`

## Privacy & Security

- All data is stored securely in your Google account using Google's UserProperties service
- No data is shared with third parties
- Works entirely within Gmail - no external services required

## Technical Details

- Built using Google Apps Script and Card Service API
- Uses Google's UserProperties service for secure data storage
- Lightweight design ensures fast loading and responsiveness

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Transform your Gmail inbox into a powerful lead management system and never lose track of important relationships again!
