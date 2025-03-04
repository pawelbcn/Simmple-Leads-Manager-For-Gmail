/**
 * Cache for storing leads data to reduce API calls
 */
const AppCache = {
  leadsData: null,
  
  /**
   * Get leads data from user properties
   * @return {Array} Array of lead objects
   */
  getLeadsData: function() {
    if (!this.leadsData) {
      const userProperties = PropertiesService.getUserProperties();
      const storedLeads = userProperties.getProperty(CONSTANTS.PROPERTIES.LEADS_DATA);
      
      if (storedLeads) {
        this.leadsData = JSON.parse(storedLeads);
      } else {
        // Initialize with empty array if no leads exist
        this.leadsData = [];
        this.saveLeadsData(this.leadsData);
      }
    }
    return this.leadsData;
  },
  
  /**
   * Save leads data to user properties
   * @param {Array} leadsData - Array of lead objects
   */
  saveLeadsData: function(leadsData) {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(
      CONSTANTS.PROPERTIES.LEADS_DATA, 
      JSON.stringify(leadsData)
    );
    this.leadsData = leadsData;
  },
  
  /**
   * Get leads settings from user properties
   * @return {Object} Leads settings object
   */
  getLeadsSettings: function() {
    const userProperties = PropertiesService.getUserProperties();
    const storedSettings = userProperties.getProperty(CONSTANTS.PROPERTIES.LEADS_SETTINGS);
    
    if (storedSettings) {
      return JSON.parse(storedSettings);
    } else {
      // Default settings
      const defaultSettings = {
        autoCreateLead: true,
        defaultStatus: CONSTANTS.LEADS.STATUS.NEW,
        useCustomIds: false
      };
      this.saveLeadsSettings(defaultSettings);
      return defaultSettings;
    }
  },
  
  /**
   * Save leads settings to user properties
   * @param {Object} settings - The settings object
   */
  saveLeadsSettings: function(settings) {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(
      CONSTANTS.PROPERTIES.LEADS_SETTINGS,
      JSON.stringify(settings)
    );
  },
  
  /**
   * Clear the cache
   */
  clearCache: function() {
    this.leadsData = null;
  }
};
