/**
 * Creates the Leads tab content
 * @return {CardSection} The leads card content
 */
function getLeadsCardContent() {
  const cardSection = CardService.newCardSection()
    .setCollapsible(false);
  const leadsData = AppCache.getLeadsData();
  
  // Add header for leads section - FIXED: removed TextStyle.TITLE
  cardSection.addWidget(CardService.newTextParagraph()
    .setText("Manage your leads and link them to emails."));
  
  // Add "Create New Lead" button
  cardSection.addWidget(
    CardService.newTextButton()
      .setText("Create New Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction().setFunctionName("showCreateLeadForm"))
  );
  
  // Add "Leads Settings" button
  cardSection.addWidget(
    CardService.newTextButton()
      .setText("Leads Settings")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction().setFunctionName("showLeadsSettings"))
  );
  
  // Add a horizontal divider
  cardSection.addWidget(CardService.newDivider());
  
  // Display existing leads - FIXED: removed TextStyle.TITLE
  cardSection.addWidget(CardService.newTextParagraph()
    .setText("Your Leads:"));
  
  if (leadsData.length === 0) {
    cardSection.addWidget(CardService.newTextParagraph()
      .setText("No leads created yet. Click 'Create New Lead' to add one."));
  } else {
    // Sort leads by creation date (newest first)
    const sortedLeads = [...leadsData].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    sortedLeads.forEach(lead => {
      const leadStatus = lead.status || CONSTANTS.LEADS.STATUS.NEW;
      const statusColor = getStatusColor(leadStatus);
      
      const leadItem = CardService.newDecoratedText()
        .setText(lead.name)
        .setTopLabel(`ID: ${lead.id}`)
        .setBottomLabel(`Status: ${leadStatus}`)
        .setWrapText(true)
        .setButton(
          CardService.newTextButton()
            .setText("Details")
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor(statusColor)
            .setOnClickAction(CardService.newAction()
              .setFunctionName("showLeadDetails")
              .setParameters({ leadId: lead.id })
            )
        );
      
      cardSection.addWidget(leadItem);
    });
  }
  
  return cardSection;
}

/**
 * Show form to create a new lead
 * @return {Card} The create lead form card
 */
function showCreateLeadForm() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Create New Lead")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection()
    .setCollapsible(false);
  
  // Add form fields
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadName")
      .setTitle("Lead Name")
      .setHint("Company or contact name")
  );
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadEmail")
      .setTitle("Email")
      .setHint("Primary contact email")
  );
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadPhone")
      .setTitle("Phone")
      .setHint("Contact phone (optional)")
  );
  
  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Status")
      .setFieldName("leadStatus")
      .addItem(CONSTANTS.LEADS.STATUS.NEW, CONSTANTS.LEADS.STATUS.NEW, true)
      .addItem(CONSTANTS.LEADS.STATUS.CONTACTED, CONSTANTS.LEADS.STATUS.CONTACTED, false)
      .addItem(CONSTANTS.LEADS.STATUS.QUALIFIED, CONSTANTS.LEADS.STATUS.QUALIFIED, false)
      .addItem(CONSTANTS.LEADS.STATUS.PROPOSAL, CONSTANTS.LEADS.STATUS.PROPOSAL, false)
      .addItem(CONSTANTS.LEADS.STATUS.NEGOTIATION, CONSTANTS.LEADS.STATUS.NEGOTIATION, false)
      .addItem(CONSTANTS.LEADS.STATUS.WON, CONSTANTS.LEADS.STATUS.WON, false)
      .addItem(CONSTANTS.LEADS.STATUS.LOST, CONSTANTS.LEADS.STATUS.LOST, false)
  );
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadNotes")
      .setTitle("Notes")
      .setMultiline(true)
  );
  
  // Add buttons
  const buttonSet = CardService.newButtonSet();
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Create Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction().setFunctionName("createNewLead"))
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Cancel")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.ERROR)
      .setOnClickAction(CardService.newAction().setFunctionName("showLeadsManager"))
  );
  
  section.addWidget(buttonSet);
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Create a new lead from form data
 * @param {Object} e - The event object
 * @return {Card} Updated card after creating lead
 */
function createNewLead(e) {
  const formInputs = e.formInput;
  
  // Validate required fields
  if (!formInputs.leadName) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead name is required"))
      .build();
  }
  
  // Get existing leads
  const leadsData = AppCache.getLeadsData();
  
  // Generate a unique ID
  const leadId = generateLeadId();
  
  // Create new lead object
  const newLead = {
    id: leadId,
    name: formInputs.leadName,
    email: formInputs.leadEmail || "",
    phone: formInputs.leadPhone || "",
    status: formInputs.leadStatus || CONSTANTS.LEADS.STATUS.NEW,
    notes: formInputs.leadNotes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedEmails: []
  };
  
  // Add to leads data
  leadsData.push(newLead);
  
  // Save updated leads data
  AppCache.saveLeadsData(leadsData);
  
  // Return to the leads manager with success message
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Lead created successfully"))
    .setNavigation(CardService.newNavigation().pushCard(showLeadsManager().navigation.pushCard))
    .build();
}

/**
 * Show lead details
 * @param {Object} e - The event object
 * @return {Card} The lead details card
 */
function showLeadDetails(e) {
  const leadId = e.parameters.leadId;
  const leadsData = AppCache.getLeadsData();
  
  // Find the lead by ID
  const lead = leadsData.find(lead => lead.id === leadId);
  
  if (!lead) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead not found"))
      .setNavigation(CardService.newNavigation().pushCard(showLeadsManager().navigation.pushCard))
      .build();
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle(lead.name)
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  // Lead details section
  const detailsSection = CardService.newCardSection()
    .setHeader("Lead Details")
    .setCollapsible(false);
  
  detailsSection.addWidget(CardService.newKeyValue()
    .setTopLabel("ID")
    .setContent(lead.id));
  
  detailsSection.addWidget(CardService.newKeyValue()
    .setTopLabel("Email")
    .setContent(lead.email || "Not provided"));
  
  detailsSection.addWidget(CardService.newKeyValue()
    .setTopLabel("Phone")
    .setContent(lead.phone || "Not provided"));
  
  detailsSection.addWidget(CardService.newKeyValue()
    .setTopLabel("Status")
    .setContent(lead.status));
  
  detailsSection.addWidget(CardService.newKeyValue()
    .setTopLabel("Created")
    .setContent(new Date(lead.createdAt).toLocaleString()));
  
  if (lead.notes) {
    detailsSection.addWidget(CardService.newKeyValue()
      .setTopLabel("Notes")
      .setContent(lead.notes)
      .setMultiline(true));
  }
  
  // Linked emails section
  const emailsSection = CardService.newCardSection()
    .setHeader("Linked Emails")
    .setCollapsible(false);
  
  if (lead.linkedEmails && lead.linkedEmails.length > 0) {
    lead.linkedEmails.forEach(emailData => {
      const emailItem = CardService.newKeyValue()
        .setTopLabel(emailData.date)
        .setContent(emailData.subject || "No subject")
        .setOnClickAction(CardService.newAction()
          .setFunctionName("openEmail")
          .setParameters({ messageId: emailData.messageId }));
      
      emailsSection.addWidget(emailItem);
    });
  } else {
    emailsSection.addWidget(CardService.newTextParagraph()
      .setText("No emails linked to this lead yet."));
  }
  
  // Action buttons
  const actionsSection = CardService.newCardSection();
  
  const buttonSet = CardService.newButtonSet();
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Edit Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("editLead")
        .setParameters({ leadId: lead.id }))
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Back")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("showLeadsManager"))
  );
  
  actionsSection.addWidget(buttonSet);
  
  // Add all sections to the card
  card.addSection(detailsSection);
  card.addSection(emailsSection);
  card.addSection(actionsSection);
  
  return card.build();
}

/**
 * Show form to edit a lead
 * @param {Object} e - The event object
 * @return {Card} The edit lead form card
 */
function editLead(e) {
  const leadId = e.parameters.leadId;
  const leadsData = AppCache.getLeadsData();
  
  // Find the lead by ID
  const lead = leadsData.find(lead => lead.id === leadId);
  
  if (!lead) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead not found"))
      .setNavigation(CardService.newNavigation().pushCard(showLeadsManager().navigation.pushCard))
      .build();
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Edit Lead")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection()
    .setCollapsible(false);
  
  // Add form fields with current values
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadName")
      .setTitle("Lead Name")
      .setValue(lead.name)
  );
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadEmail")
      .setTitle("Email")
      .setValue(lead.email || "")
  );
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadPhone")
      .setTitle("Phone")
      .setValue(lead.phone || "")
  );
  
  const statusInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle("Status")
    .setFieldName("leadStatus");
  
  // Add all status options, setting the current one as selected
  Object.values(CONSTANTS.LEADS.STATUS).forEach(status => {
    statusInput.addItem(status, status, status === lead.status);
  });
  
  section.addWidget(statusInput);
  
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadNotes")
      .setTitle("Notes")
      .setMultiline(true)
      .setValue(lead.notes || "")
  );
  
  // Add hidden field for lead ID
  section.addWidget(
    CardService.newTextInput()
      .setFieldName("leadId")
      .setTitle("Lead ID")
      .setValue(lead.id)
      .setHint("Do not modify this ID")
  );
  
  // Add buttons
  const buttonSet = CardService.newButtonSet();
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Save Changes")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction().setFunctionName("updateLead"))
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Delete Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.ERROR)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("confirmDeleteLead")
        .setParameters({ leadId: lead.id }))
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Cancel")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("showLeadDetails")
        .setParameters({ leadId: lead.id }))
  );
  
  section.addWidget(buttonSet);
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Update a lead from form data
 * @param {Object} e - The event object
 * @return {Card} Updated card after updating lead
 */
function updateLead(e) {
  const formInputs = e.formInput;
  const leadId = formInputs.leadId;
  
  if (!leadId || !formInputs.leadName) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead ID and name are required"))
      .build();
  }
  
  // Get existing leads
  const leadsData = AppCache.getLeadsData();
  
  // Find the lead by ID
  const leadIndex = leadsData.findIndex(lead => lead.id === leadId);
  
  if (leadIndex === -1) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Lead not found"))
      .build();
  }
  
  // Update lead data
  const updatedLead = {
    ...leadsData[leadIndex],
    name: formInputs.leadName,
    email: formInputs.leadEmail || "",
    phone: formInputs.leadPhone || "",
    status: formInputs.leadStatus || leadsData[leadIndex].status,
    notes: formInputs.leadNotes || "",
    updatedAt: new Date().toISOString()
  };
  
  // Replace the lead in the array
  leadsData[leadIndex] = updatedLead;
  
  // Save updated leads data
  AppCache.saveLeadsData(leadsData);
  
  // Return to the lead details with success message
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Lead updated successfully"))
    .setNavigation(CardService.newNavigation().pushCard(
      showLeadDetails({ parameters: { leadId: leadId } })
    ))
    .build();
}

/**
 * Show confirmation dialog for deleting a lead
 * @param {Object} e - The event object
 * @return {ActionResponse} The action response with dialog
 */
function confirmDeleteLead(e) {
  const leadId = e.parameters.leadId;
  
  // Create a card for the confirmation dialog
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Confirm Delete")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection();
  
  section.addWidget(CardService.newTextParagraph()
    .setText("Are you sure you want to delete this lead? This action cannot be undone. All information associated with this lead will be permanently deleted."));
  
  // Add buttons for confirm and cancel
  const buttonSet = CardService.newButtonSet();
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Delete")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.ERROR)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("deleteLead")
        .setParameters({ leadId: leadId }))
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Cancel")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("showLeadDetails")
        .setParameters({ leadId: leadId }))
  );
  
  section.addWidget(buttonSet);
  card.addSection(section);
  
  // Return navigation to the confirmation card
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card.build()))
    .build();
}

/**
 * Delete a lead
 * @param {Object} e - The event object
 * @return {Card} Updated card after deleting lead
 */
function deleteLead(e) {
  const leadId = e.parameters.leadId;
  
  // Get existing leads
  const leadsData = AppCache.getLeadsData();
  
  // Filter out the lead to delete
  const updatedLeadsData = leadsData.filter(lead => lead.id !== leadId);
  
  // Save updated leads data
  AppCache.saveLeadsData(updatedLeadsData);
  
  // Create a new card to return to leads manager
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Leads Manager")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  // Add the leads content section
  try {
    card.addSection(getLeadsCardContent());
  } catch (error) {
    card.addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText("An error occurred loading leads data. Please try again."))
    );
    console.error("Error loading leads content: " + error.toString());
  }
  
  // Return directly to the leads manager with a notification
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("Lead deleted successfully"))
    .setNavigation(CardService.newNavigation().pushCard(card.build()))
    .build();
}

/**
 * Show leads settings
 * @return {Card} The leads settings card
 */
function showLeadsSettings() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Leads Settings")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection()
    .setCollapsible(false);
  
  // Get current settings
  const settings = AppCache.getLeadsSettings();
  
  // Add settings options
  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.CHECK_BOX)
      .setTitle("Automatically create leads from new emails")
      .setFieldName("autoCreateLead")
      .addItem("Enable", "true", settings.autoCreateLead)
  );
  
  const defaultStatusInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle("Default status for new leads")
    .setFieldName("defaultStatus");
  
  // Add all status options
  Object.values(CONSTANTS.LEADS.STATUS).forEach(status => {
    defaultStatusInput.addItem(status, status, status === settings.defaultStatus);
  });
  
  section.addWidget(defaultStatusInput);
  
  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.CHECK_BOX)
      .setTitle("Use custom IDs for leads")
      .setFieldName("useCustomIds")
      .addItem("Enable", "true", settings.useCustomIds)
  );
  
  // Add buttons
  const buttonSet = CardService.newButtonSet();
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Save Settings")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction().setFunctionName("saveLeadsSettings"))
  );
  
  buttonSet.addButton(
    CardService.newTextButton()
      .setText("Cancel")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction().setFunctionName("showLeadsManager"))
  );
  
  section.addWidget(buttonSet);
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Save leads settings
 * @param {Object} e - The event object
 * @return {Card} Updated card after saving settings
 */
function saveLeadsSettings(e) {
  const formInputs = e.formInput;
  
  // Create settings object
  const settings = {
    autoCreateLead: formInputs.autoCreateLead === "true",
    defaultStatus: formInputs.defaultStatus || CONSTANTS.LEADS.STATUS.NEW,
    useCustomIds: formInputs.useCustomIds === "true"
  };
  
  // Save settings
  AppCache.saveLeadsSettings(settings);
  
  // Return to the leads manager with success message
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Settings saved successfully"))
    .setNavigation(CardService.newNavigation().pushCard(showLeadsManager().navigation.pushCard))
    .build();
}
