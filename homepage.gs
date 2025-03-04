/**
 * Builds the homepage card for the Gmail Add-on.
 * @return {Card} The homepage card
 */
function getHomepageCard() {
  // Create card with fixed title to avoid dependency on CONSTANTS
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Leads Manager")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));

  // Create main section
  const section = CardService.newCardSection()
    .setCollapsible(false);
  
  // Add header section explaining the add-on - FIXING THE ERROR HERE by removing TextStyle.TITLE
  section.addWidget(CardService.newTextParagraph()
    .setText("Welcome to the Leads Manager for Gmail!"));
  
  section.addWidget(CardService.newDivider());
  
  // Add Leads Manager button
  section.addWidget(CardService.newTextButton()
    .setText("Leads Manager")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor("#1A73E8") // Primary color
    .setOnClickAction(CardService.newAction().setFunctionName("showLeadsManager")));
  
  section.addWidget(CardService.newDivider());
  
  // Add some guidance text
  section.addWidget(CardService.newTextParagraph()
    .setText("You can also access these features when viewing an email."));
  
  // Recent leads section - FIXING ANOTHER POTENTIAL ERROR HERE
  section.addWidget(CardService.newTextParagraph()
    .setText("Recent Leads:"));
  
  try {
    // Get leads data - wrapped in try/catch to handle potential errors
    const leadsData = AppCache.getLeadsData();
    
    // Sort leads by creation date (newest first) and take the top 3
    const recentLeads = [...leadsData]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
    
    if (recentLeads.length > 0) {
      recentLeads.forEach(lead => {
        section.addWidget(
          CardService.newDecoratedText()
            .setText(lead.name)
            .setBottomLabel(`Status: ${lead.status}`)
            .setOnClickAction(CardService.newAction()
              .setFunctionName("showLeadDetails")
              .setParameters({ leadId: lead.id }))
        );
      });
    } else {
      section.addWidget(
        CardService.newTextParagraph()
          .setText("No leads created yet. Click 'Leads Manager' to add one.")
      );
    }
  } catch (error) {
    // Handle any errors gracefully
    section.addWidget(
      CardService.newTextParagraph()
        .setText("Unable to load leads. Click 'Leads Manager' to view your leads.")
    );
    
    console.error("Error loading leads: " + error.toString());
  }
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Shows the leads manager when selected from the homepage
 * @return {ActionResponse} The action response with the leads card
 */
function showLeadsManager() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Leads Manager")
      .setImageStyle(CardService.ImageStyle.SQUARE)
      .setImageUrl("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/24px.svg"));
  
  try {
    card.addSection(getLeadsCardContent());
    
    // Add button to go back to home
    const homeSection = CardService.newCardSection();
    homeSection.addWidget(CardService.newTextButton()
      .setText("Back to Home")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor("#1A73E8") // Primary color
      .setOnClickAction(CardService.newAction().setFunctionName("getHomepageCard")));
    
    card.addSection(homeSection);
  } catch (error) {
    // Handle errors gracefully
    card.addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText("An error occurred loading leads data. Please try again."))
        .addWidget(CardService.newTextButton()
          .setText("Back to Home")
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor("#1A73E8") // Primary color
          .setOnClickAction(CardService.newAction().setFunctionName("getHomepageCard")))
    );
    
    console.error("Error in showLeadsManager: " + error.toString());
  }
  
  // Return a navigation action to the leads manager card
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card.build()))
    .build();
}
