/**
 * Triggered when an email is opened.
 * This function creates the contextual add-on for linking emails to leads.
 * @param {Object} e - The event object
 * @return {Card} The contextual add-on card
 */
function getContextualAddOn(e) {
  const messageId = e.gmail.messageId;
  const message = GmailApp.getMessageById(messageId);
  
  // Create a leads card
  const leadsCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Leads Manager")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  leadsCard.addSection(getContextualLeadsSection(messageId, message));
  
  // Return the leads card as the default view
  return leadsCard.build();
}

/**
 * Create the Leads section for the contextual add-on
 * @param {string} messageId - The Gmail message ID
 * @param {GmailMessage} message - The Gmail message object
 * @return {CardSection} The leads card section
 */
function getContextualLeadsSection(messageId, message) {
  const section = CardService.newCardSection()
    .setCollapsible(false);
  
  // Get message details
  const subject = message.getSubject() || "No subject";
  const sender = message.getFrom();
  const date = message.getDate().toLocaleString();
  const thread = message.getThread();
  
  // Extract email address from sender string
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const emailMatch = sender.match(emailRegex);
  const senderEmail = emailMatch ? emailMatch[0] : "";
  
  // Header for Current Email section
  section.addWidget(CardService.newTextParagraph()
    .setText("Current Email:"));
  section.addWidget(CardService.newKeyValue()
    .setTopLabel("Subject")
    .setContent(subject));
  section.addWidget(CardService.newKeyValue()
    .setTopLabel("From")
    .setContent(sender));
  section.addWidget(CardService.newKeyValue()
    .setTopLabel("Date")
    .setContent(date));
  
  // Add a horizontal divider
  section.addWidget(CardService.newDivider());
  
  // Get leads data
  const leadsData = AppCache.getLeadsData();
  
  // Check if this email is already linked to any leads
  const linkedLeads = leadsData.filter(lead => 
    lead.linkedEmails && lead.linkedEmails.some(email => email.messageId === messageId)
  );
  
  if (linkedLeads.length > 0) {
    section.addWidget(CardService.newTextParagraph()
      .setText("Linked to Leads:"));
    
    linkedLeads.forEach(lead => {
      section.addWidget(CardService.newDecoratedText()
        .setText(lead.name)
        .setTopLabel(`ID: ${lead.id}`)
        .setBottomLabel(`Status: ${lead.status || CONSTANTS.LEADS.STATUS.NEW}`)
        .setButton(CardService.newTextButton()
          .setText("View")
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor(getStatusColor(lead.status || CONSTANTS.LEADS.STATUS.NEW))
          .setOnClickAction(CardService.newAction()
            .setFunctionName("showLeadDetails")
            .setParameters({ leadId: lead.id })
          )
        )
      );
    });
    
    section.addWidget(CardService.newDivider());
  }
  
  // Show existing leads to link to
  section.addWidget(CardService.newTextParagraph()
    .setText("Link to Existing Lead:"));
  
  if (leadsData.length === 0) {
    section.addWidget(CardService.newTextParagraph()
      .setText("No leads available. Create a new lead first."));
  } else {
    // Find leads matching the sender's email
    const matchingLeads = leadsData.filter(lead => 
      lead.email && lead.email.toLowerCase() === senderEmail.toLowerCase()
    );
    
    // Create dropdown of available leads, sorted by name
    const leadsDropdown = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Select Lead")
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
    section.addWidget(
      CardService.newTextButton()
        .setText("Link to Lead")
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
        .setOnClickAction(CardService.newAction()
          .setFunctionName("linkEmailToLead")
          .setParameters({ 
            messageId: messageId,
            subject: subject,
            sender: sender,
            date: date,
            threadId: thread.getId() // Store threadId for linking the entire thread
          })
        )
    );
  }
  
  // Add a horizontal divider
  section.addWidget(CardService.newDivider());
  
  // Quick create lead section
  section.addWidget(CardService.newTextParagraph()
    .setText("Quick Create Lead:"));
  
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
  
  // Name field
  section.addWidget(CardService.newTextInput()
    .setFieldName("quickLeadName")
    .setTitle("Lead Name")
    .setValue(suggestedName)
  );
  
  // Email field
  section.addWidget(CardService.newTextInput()
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
  
  // Add button to create and link lead
  section.addWidget(CardService.newTextButton()
    .setText("Create & Link Lead")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
    .setOnClickAction(CardService.newAction()
      .setFunctionName("createAndLinkLead")
      .setParameters({ 
        messageId: messageId,
        subject: subject,
        sender: sender,
        date: date,
        threadId: thread.getId() // Store threadId for linking the entire thread
      })
    )
  );
  
  return section;
}

/**
 * Link an email to an existing lead
 * @param {Object} e - The event object
 * @return {ActionResponse} The action response
 */
function linkEmailToLead(e) {
  const messageId = e.parameters.messageId;
  const threadId = e.parameters.threadId;
  const subject = e.parameters.subject;
  const sender = e.parameters.sender;
  const date = e.parameters.date;
  const leadId = e.formInput.selectedLead;
  
  // Check if a lead was selected
  if (!leadId || leadId === "separator") {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Please select a lead to link"))
      .build();
  }
  
  // Get leads data
  const leadsData = AppCache.getLeadsData();
  
  // Find the lead
  const leadIndex = leadsData.findIndex(lead => lead.id === leadId);
  
  if (leadIndex === -1) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead not found"))
      .build();
  }
  
  // Check if this email is already linked to this lead
  if (leadsData[leadIndex].linkedEmails && 
      leadsData[leadIndex].linkedEmails.some(email => email.messageId === messageId)) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("This email is already linked to the selected lead"))
      .build();
  }
  
  // Ensure linkedEmails array exists
  if (!leadsData[leadIndex].linkedEmails) {
    leadsData[leadIndex].linkedEmails = [];
  }
  
  // Add email to lead's linkedEmails
  leadsData[leadIndex].linkedEmails.push({
    messageId: messageId,
    threadId: threadId, // Store threadId for accessing the entire conversation
    subject: subject,
    sender: sender,
    date: date,
    linkedAt: new Date().toISOString()
  });
  
  // Update the lead's updatedAt timestamp
  leadsData[leadIndex].updatedAt = new Date().toISOString();
  
  // Save updated leads data
  AppCache.saveLeadsData(leadsData);
  
  // Return success message
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Email linked to lead successfully"))
    .build();
}

/**
 * Create a new lead and link the current email to it
 * @param {Object} e - The event object
 * @return {ActionResponse} The action response
 */
function createAndLinkLead(e) {
  const messageId = e.parameters.messageId;
  const threadId = e.parameters.threadId;
  const subject = e.parameters.subject;
  const sender = e.parameters.sender;
  const date = e.parameters.date;
  
  const leadName = e.formInput.quickLeadName;
  const leadEmail = e.formInput.quickLeadEmail;
  const leadStatus = e.formInput.quickLeadStatus;
  
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
    notes: `Created from email: ${subject}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedEmails: [
      {
        messageId: messageId,
        threadId: threadId, // Store threadId for accessing the entire conversation
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
  
  // Return success message
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("New lead created and linked to email successfully"))
    .build();
} 
