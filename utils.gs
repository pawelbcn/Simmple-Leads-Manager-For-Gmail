/**
 * Get a color corresponding to a lead status
 * @param {string} status - The lead status
 * @return {string} A color hex code
 */
function getStatusColor(status) {
  const statusColors = {
    [CONSTANTS.LEADS.STATUS.NEW]: "#5F6368", // Gray
    [CONSTANTS.LEADS.STATUS.CONTACTED]: "#4285F4", // Blue
    [CONSTANTS.LEADS.STATUS.QUALIFIED]: "#1A73E8", // Darker Blue
    [CONSTANTS.LEADS.STATUS.PROPOSAL]: "#FBBC04", // Yellow
    [CONSTANTS.LEADS.STATUS.NEGOTIATION]: "#F9AB00", // Orange
    [CONSTANTS.LEADS.STATUS.WON]: "#34A853", // Green
    [CONSTANTS.LEADS.STATUS.LOST]: "#EA4335" // Red
  };
  
  return statusColors[status] || "#5F6368"; // Default to gray
}

/**
 * Generate a unique ID for a lead
 * @return {string} A unique ID
 */
function generateLeadId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `L-${timestamp}-${random}`;
}

/**
 * Open an email in Gmail
 * @param {Object} e - The event object
 * @return {OpenLink} The open link action
 */
function openEmail(e) {
  const messageId = e.parameters.messageId;
  const url = `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(url)
      .setOpenAs(CardService.OpenAs.FULL_SIZE))
    .build();
}

/**
 * Close the toolbar card
 * @return {ActionResponse} The action response
 */
function closeToolbarCard() {
  return CardService.newActionResponseBuilder().build();
}

/**
 * Define updates to appsscript.json
 * This function is not called but provides the necessary JSON to update the manifest
 */
function getUpdatedAppsScriptJson() {
  const json = {
    "timeZone": "Europe/Warsaw",
    "dependencies": {},
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "oauthScopes": [
      "https://www.googleapis.com/auth/gmail.addons.execute",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/script.external_request",
      "https://www.googleapis.com/auth/userinfo.email"
    ],
    "addOns": {
      "common": {
        "name": "Leads Manager",
        "logoUrl": "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"  
      },
      "gmail": {
        "homepageTrigger": {
          "runFunction": "getHomepageCard"
        },
        "contextualTriggers": [{
          "unconditional": {},
          "onTriggerFunction": "getContextualAddOn"
        }],
        "universalActions": [{
          "text": "Link to Lead",
          "runFunction": "onGmailMessageAction"
        }]
      }
    }
  };
  
  // Return the JSON - this is just for reference
  return json;
}
