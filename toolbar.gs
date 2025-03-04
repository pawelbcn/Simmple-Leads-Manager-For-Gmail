/**
 * Universal Action to quickly attach the current email thread to an existing lead
 * @param {Object} e - The event object
 * @return {UniversalActionResponse} The universal action response
 */
function onGmailMessageAction(e) {
  const messageId = e.gmail.messageId;
  const message = GmailApp.getMessageById(messageId);
  const thread = message.getThread();
  const subject = message.getSubject() || "No subject";
  const sender = message.getFrom();
  const date = message.getDate().toLocaleString();
  
  // Create a card for quick lead selection
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Link to Lead")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection();
  
  // Get leads data
  const leadsData = AppCache.getLeadsData();
  
  if (leadsData.length === 0) {
    section.addWidget(CardService.newTextParagraph()
      .setText("No leads available. Create a lead first."));
  } else {
    // Extract email address from sender string
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = sender.match(emailRegex);
    const senderEmail = emailMatch ? emailMatch[0] : "";
    
    // Find leads matching the sender's email
    const matchingLeads = leadsData.filter(lead => 
      lead.email && lead.email.toLowerCase() === senderEmail.toLowerCase()
    );
    
    // Create dropdown of available leads, sorted by name
    const leadsDropdown = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Select a lead to link to this email")
      .setFieldName("selectedLead");
    
    // If there are matching leads, show them first
    if (matchingLeads.length > 0) {
      section.addWidget(CardService.newTextParagraph()
        .setText("Suggested leads based on sender email:"));
      
      matchingLeads.sort((a, b) => a.name.localeCompare(b.name)).forEach(lead => {
        leadsDropdown.addItem(`${lead.name} (${lead.status})`, lead.id, false);
      });
      
      // Add separator if needed
      if (leadsData.length > matchingLeads.length) {
        leadsDropdown.addItem("──────────", "separator", false);
      }
    }
    
    // Add all other leads
    const otherLeads = leadsData.filter(lead => 
      !matchingLeads.some(match => match.id === lead.id)
    );
    
    otherLeads.sort((a, b) => a.name.localeCompare(b.name)).forEach(lead => {
      leadsDropdown.addItem(`${lead.name} (${lead.status})`, lead.id, false);
    });
    
    section.addWidget(leadsDropdown);
    
    // Add button to link the selected lead
    section.addWidget(CardService.newTextButton()
      .setText("Link to Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("quickLinkEmailToLead")
        .setParameters({ 
          messageId: messageId,
          threadId: thread.getId(),
          subject: subject,
          sender: sender,
          date: date
        })
      )
    );
  }
  
  // Add button to create a new lead
  section.addWidget(CardService.newTextButton()
    .setText("Create New Lead")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
    .setOnClickAction(CardService.newAction()
      .setFunctionName("showCreateLeadFromToolbar")
      .setParameters({ 
        messageId: messageId,
        threadId: thread.getId(),
        subject: subject,
        sender: sender,
        date: date
      })
    )
  );
  
  card.addSection(section);
  
  const universalActionResponse = CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([card.build()])
    .build();
  
  return universalActionResponse;
}

/**
 * Quick link email to lead from toolbar action
 * @param {Object} e - The event object
 * @return {ActionResponse} The action response
 */
function quickLinkEmailToLead(e) {
  return linkEmailToLead(e);
}

/**
 * Show form to create a new lead from toolbar
 * @param {Object} e - The event object
 * @return {Card} The create lead form card
 */
function showCreateLeadFromToolbar(e) {
  const messageId = e.parameters.messageId;
  const threadId = e.parameters.threadId;
  const subject = e.parameters.subject;
  const sender = e.parameters.sender;
  const date = e.parameters.date;
  
  // Extract email address from sender string
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const emailMatch = sender.match(emailRegex);
  const senderEmail = emailMatch ? emailMatch[0] : "";
  
  // Prefill name from sender if possible
  let suggestedName = "";
  if (sender) {
    // Try to extract a name from the "Name <email>" format
    const nameMatch = sender.match(/(.*?)\s*<[^>]+>/);
    if (nameMatch && nameMatch[1]) {
      suggestedName = nameMatch[1].trim();
    } else {
      // Use email username as fallback
      const emailParts = senderEmail.split('@');
      if (emailParts.length > 0) {
        suggestedName = emailParts[0];
      }
    }
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Create New Lead")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection();
  
  // Add form fields
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("quickLeadName")
      .setTitle("Lead Name")
      .setValue(suggestedName)
  );
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("quickLeadEmail")
      .setTitle("Email")
      .setValue(senderEmail)
  );
  
  // Status dropdown
  const statusDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle("Status")
    .setFieldName("quickLeadStatus");
  
  // Get default status from settings
  const settings = AppCache.getLeadsSettings();
  const defaultStatus = settings.defaultStatus || CONSTANTS.LEADS.STATUS.NEW;
  
  Object.values(CONSTANTS.LEADS.STATUS).forEach(status => {
    statusDropdown.addItem(status, status, status === defaultStatus);
  });
  
  section.addWidget(statusDropdown);
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadNotes")
      .setTitle("Notes")
      .setMultiline(true)
      .setValue(`Created from email: ${subject}`)
  );
  
  // Add buttons
  const buttonSet = CardService.newButtonSet();
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Create & Link Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("createAndLinkLeadFromToolbar")
        .setParameters({ 
          messageId: messageId,
          threadId: threadId,
          subject: subject,
          sender: sender,
          date: date
        })
      )
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Cancel")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.ERROR)
      .setOnClickAction(CardService.newAction().setFunctionName("closeToolbarCard"))
  );
  
  section.addWidget(buttonSet);
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Create and link lead from toolbar action
 * @param {Object} e - The event object
 * @return {ActionResponse} The action response
 */
function createAndLinkLeadFromToolbar(e) {
  const messageId = e.parameters.messageId;
  const threadId = e.parameters.threadId;
  const subject = e.parameters.subject;
  const sender = e.parameters.sender;
  const date = e.parameters.date;
  
  const leadName = e.formInput.quickLeadName;
  const leadEmail = e.formInput.quickLeadEmail;
  const leadStatus = e.formInput.quickLeadStatus;
  const leadNotes = e.formInput.leadNotes || `Created from email: ${subject}`;
  
  // Validate required fields
  if (!leadName) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead name is required"))
      .build();
  }
  
  // Get leads data
  const leadsData = AppCache.getLeadsData();
  
  // Generate a unique ID
  const leadId = generateLeadId();
  
  // Create new lead object with the linked email
  const newLead = {
    id: leadId,
    name: leadName,
    email: leadEmail || "",
    phone: "",
    status: leadStatus || CONSTANTS.LEADS.STATUS.NEW,
    notes: leadNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedEmails: [
      {
        messageId: messageId,
        threadId: threadId,
        subject: subject,
        sender: sender,
        date: date,
        linkedAt: new Date().toISOString()
      }
    ]
  };
  
  // Add to leads data
  leadsData.push(newLead);
  
  // Save updated leads data
  AppCache.saveLeadsData(leadsData);
  
  // Return success message and close the card
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("New lead created and linked to email successfully"))
    .build();
}
