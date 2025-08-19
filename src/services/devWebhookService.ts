/**
 * Development Webhook Service
 * Handles webhook calls with development-friendly logging and CORS handling
 */

import webhookService from './webhookService';

class DevWebhookService {
  private isDevelopment = process.env.NODE_ENV === 'development';

  async sendWithFallback(data: any): Promise<boolean> {
    if (this.isDevelopment) {
      // Log the data that would be sent to n8n/Google Sheets
      console.log('🔄 [DEV MODE] Data that would be sent to Google Sheets via n8n:');
      console.table(data);
      
      // Also save to localStorage for debugging
      this.saveToLocalStorage(data);
    }

    try {
      // Try to send to actual webhook
      return await webhookService.sendToWebhook(data as any);
    } catch (error) {
      if (this.isDevelopment) {
        console.warn('⚠️ Webhook failed (expected in dev due to CORS), data logged locally');
        return true; // Return success in dev mode
      }
      throw error;
    }
  }

  private saveToLocalStorage(data: any) {
    try {
      const existingData = JSON.parse(localStorage.getItem('n8n_webhook_data') || '[]');
      existingData.push({
        ...data,
        _id: Date.now(),
        _localTimestamp: new Date().toLocaleString()
      });
      
      // Keep only last 100 entries
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem('n8n_webhook_data', JSON.stringify(existingData));
      console.log('💾 Data saved to localStorage for debugging');
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Method to retrieve all stored data for debugging
  getStoredData(): any[] {
    try {
      return JSON.parse(localStorage.getItem('n8n_webhook_data') || '[]');
    } catch {
      return [];
    }
  }

  // Method to clear stored data
  clearStoredData(): void {
    localStorage.removeItem('n8n_webhook_data');
    console.log('🧹 Cleared stored webhook data');
  }

  // Method to export data for testing
  exportData(): string {
    const data = this.getStoredData();
    return JSON.stringify(data, null, 2);
  }
}

export const devWebhookService = new DevWebhookService();
export default devWebhookService;