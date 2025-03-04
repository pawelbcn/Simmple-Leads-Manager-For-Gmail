/**
 * Creates the Gmail sidebar for Leads
 * This function will be called when the sidebar is loaded
 * @return {Card} The sidebar card
 */
function getLeadsSidebar() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Leads Manager")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  // Get leads data
  const leadsData = AppCache.getLeadsData();
  
  // Create a section for lead categories
  const categoriesSection = CardService.newCardSection()
    .setHeader("Lead Categories");
  
  // Add buttons for each lead status
  Object.values(CONSTANTS.LEADS.STATUS).forEach(status => {
    // Count leads with this status
    const count = leadsData.filter(lead => lead.status === status).length;
    
    categoriesSection.addWidget(
      CardService.newDecoratedText()
        .setText(status)
        .setBottomLabel(`${count} leads`)
        .setStartIcon(CardService.newIcon()
          .setIconUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"))
        .setOnClickAction(CardService.newAction()
          .setFunctionName("showLeadsByStatus")
          .setParameters({ status: status }))
    );
  });
  
  // Add a section for recent leads
  const recentSection = CardService.newCardSection()
    .setHeader("Recent Leads");
  
  // Sort leads by creation date (newest first) and take the top 5
  const recentLeads = [...leadsData]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  if (recentLeads.length > 0) {
    recentLeads.forEach(lead => {
      recentSection.addWidget(
        CardService.newDecoratedText()
          .setText(lead.name)
          .setBottomLabel(`Status: ${lead.status}`)
          .setOnClickAction(CardService.newAction()
            .setFunctionName("showLeadDetails")
            .setParameters({ leadId: lead.id }))
      );
    });
  } else {
    recentSection.addWidget(
      CardService.newTextParagraph()
        .setText("No leads created yet.")
    );
  }
  
  // Add a button to create a new lead
  const actionSection = CardService.newCardSection();
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("Create New Lead")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.PRIMARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("showCreateLeadForm"))
  );
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("View All Leads")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("showLeadsManager"))
  );
  
  // Add all sections to the card
  card.addSection(categoriesSection);
  card.addSection(recentSection);
  card.addSection(actionSection);
  
  return card.build();
}

/**
 * Show leads filtered by status
 * @param {Object} e - The event object
 * @return {Card} The filtered leads card
 */
function showLeadsByStatus(e) {
  const status = e.parameters.status;
  const leadsData = AppCache.getLeadsData();
  
  // Filter leads by status
  const filteredLeads = leadsData.filter(lead => lead.status === status);
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle(`${status} Leads`)
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  const section = CardService.newCardSection();
  
  if (filteredLeads.length > 0) {
    // Sort leads by name
    filteredLeads.sort((a, b) => a.name.localeCompare(b.name)).forEach(lead => {
      section.addWidget(
        CardService.newDecoratedText()
          .setText(lead.name)
          .setBottomLabel(`ID: ${lead.id}`)
          .setButton(CardService.newTextButton()
            .setText("View")
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor(getStatusColor(status))
            .setOnClickAction(CardService.newAction()
              .setFunctionName("showLeadDetails")
              .setParameters({ leadId: lead.id })))
      );
    });
  } else {
    section.addWidget(
      CardService.newTextParagraph()
        .setText(`No leads with status "${status}" found.`)
    );
  }
  
  // Add a back button
  section.addWidget(
    CardService.newTextButton()
      .setText("Back to All Leads")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(CONSTANTS.UI.COLORS.SECONDARY)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("getLeadsSidebar"))
  );
  
  card.addSection(section);
  
  return card.build();
}
