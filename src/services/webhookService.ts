/**
 * n8n Webhook Service
 * Handles sending data to n8n workflows which then forward to Google Sheets
 */

const N8N_WEBHOOK_URL = 'https://shebapaul.app.n8n.cloud/webhook-test/e65ff6e8-d766-4da4-8a10-c1ffcc4b4700';

export interface VoiceCallData {
  type: 'voice_call';
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  callDuration?: string;
  transcript: Array<{
    role: 'agent' | 'user';
    content: string;
    timestamp: number;
  }>;
  callStatus: 'completed' | 'ended' | 'error';
  metadata?: {
    agentId: string;
    sessionId: string;
  };
}

export interface UserRegistrationData {
  type: 'user_registration';
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  registrationMethod: 'signup' | 'login';
  metadata?: {
    userAgent?: string;
    referrer?: string;
  };
}

export interface OnboardingData {
  type: 'onboarding_completion';
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName: string;
  industry: string;
  businessSize: string;
  onboardingCompletedAt: string;
}

export interface ProductData {
  type: 'product_action';
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: 'create' | 'update' | 'delete';
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive' | 'low_stock';
    category?: string;
  };
  previousValues?: Partial<ProductData['product']>;
}

export interface BusinessConsultationData {
  type: 'business_consultation';
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  consultationType: 'voice_session' | 'form_submission' | 'chat_inquiry';
  consultationData: {
    topic?: string;
    priority?: 'low' | 'medium' | 'high';
    description?: string;
    requestedFollowUp?: boolean;
  };
  metadata?: Record<string, any>;
}

type WebhookData = 
  | VoiceCallData 
  | UserRegistrationData 
  | OnboardingData 
  | ProductData 
  | BusinessConsultationData;

class WebhookService {
  private async sendToWebhook(data: WebhookData): Promise<boolean> {
    try {
      console.log('📤 Sending data to n8n webhook:', data);
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          source: 'react_app',
          environment: process.env.NODE_ENV || 'development'
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Successfully sent data to n8n webhook');
      return true;
    } catch (error) {
      console.error('❌ Failed to send data to n8n webhook:', error);
      
      // In development mode, log the data locally for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEV MODE] Data that would be sent to Google Sheets:');
        console.table(data);
        
        // Save to localStorage for debugging
        try {
          const existingData = JSON.parse(localStorage.getItem('n8n_webhook_data') || '[]');
          existingData.push({
            ...data,
            _id: Date.now(),
            _localTimestamp: new Date().toLocaleString(),
            _error: error.message
          });
          
          // Keep only last 50 entries
          if (existingData.length > 50) {
            existingData.splice(0, existingData.length - 50);
          }
          
          localStorage.setItem('n8n_webhook_data', JSON.stringify(existingData));
          console.log('💾 Data saved to localStorage for debugging. Check localStorage.getItem("n8n_webhook_data")');
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError);
        }
        
        return true; // Return success in dev mode for testing
      }
      
      return false;
    }
  }

  // Voice Call Data
  async sendVoiceCallData(data: Omit<VoiceCallData, 'type' | 'timestamp'>): Promise<boolean> {
    return this.sendToWebhook({
      type: 'voice_call',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // User Registration/Login Data
  async sendUserRegistrationData(data: Omit<UserRegistrationData, 'type' | 'timestamp'>): Promise<boolean> {
    return this.sendToWebhook({
      type: 'user_registration',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Onboarding Completion Data
  async sendOnboardingData(data: Omit<OnboardingData, 'type' | 'timestamp'>): Promise<boolean> {
    return this.sendToWebhook({
      type: 'onboarding_completion',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Product Management Data
  async sendProductData(data: Omit<ProductData, 'type' | 'timestamp'>): Promise<boolean> {
    return this.sendToWebhook({
      type: 'product_action',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Business Consultation Data
  async sendConsultationData(data: Omit<BusinessConsultationData, 'type' | 'timestamp'>): Promise<boolean> {
    return this.sendToWebhook({
      type: 'business_consultation',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Batch send multiple data points
  async sendBatchData(dataArray: WebhookData[]): Promise<boolean[]> {
    const promises = dataArray.map(data => this.sendToWebhook(data));
    return Promise.all(promises);
  }
}

export const webhookService = new WebhookService();
export default webhookService;