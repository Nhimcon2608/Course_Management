import crypto from 'crypto';
import axios from 'axios';

export interface ZaloPayConfig {
  appId: string;
  key1: string;
  key2: string;
  endpoint: string;
  callbackUrl: string;
  returnUrl: string;
}

export interface ZaloPayCreateOrderRequest {
  app_id: string;
  app_user: string;
  app_time: number;
  amount: number;
  app_trans_id: string;
  embed_data: string;
  item: string;
  description: string;
  bank_code: string;
  mac: string;
  callback_url: string;
  return_url: string;
}

export interface ZaloPayCreateOrderResponse {
  return_code: number;
  return_message: string;
  sub_return_code?: number;
  sub_return_message?: string;
  zp_trans_token?: string;
  order_url?: string;
  order_token?: string;
  qr_code?: string;
}

export interface ZaloPayQueryOrderResponse {
  return_code: number;
  return_message: string;
  sub_return_code?: number;
  sub_return_message?: string;
  is_processing?: boolean;
  amount?: number;
  zp_trans_id?: string;
}

export class ZaloPayService {
  private config: ZaloPayConfig;

  constructor(config: ZaloPayConfig) {
    this.config = config;
  }

  /**
   * Generate HMAC SHA256 signature
   */
  private generateMac(data: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
    const random = Math.floor(Math.random() * 1000000);
    return `${dateStr}_${random}`;
  }

  /**
   * Get current timestamp in milliseconds
   */
  private getTimestamp(): number {
    return Date.now();
  }

  /**
   * Create ZaloPay order
   */
  async createOrder(orderData: {
    orderId: string;
    amount: number;
    description: string;
    userEmail: string;
    items: Array<{ name: string; price: number; quantity: number }>;
    embedData?: any;
  }): Promise<ZaloPayCreateOrderResponse> {
    try {
      const appTransId = this.generateTransactionId();
      const appTime = this.getTimestamp();

      // Prepare embed data
      const embedData = {
        orderId: orderData.orderId,
        redirecturl: `${this.config.returnUrl}?orderId=${orderData.orderId}`,
        ...orderData.embedData
      };

      // Prepare items data
      const items = orderData.items.map(item => ({
        itemid: item.name,
        itemname: item.name,
        itemprice: item.price,
        itemquantity: item.quantity
      }));

      // Create MAC data string
      const macData = `${this.config.appId}|${appTransId}|${orderData.userEmail}|${orderData.amount}|${appTime}|${JSON.stringify(embedData)}|${JSON.stringify(items)}`;
      
      console.log('ZaloPay MAC data:', macData);
      
      const mac = this.generateMac(macData, this.config.key1);

      // Prepare request data
      const requestData: ZaloPayCreateOrderRequest = {
        app_id: this.config.appId,
        app_user: orderData.userEmail,
        app_time: appTime,
        amount: orderData.amount,
        app_trans_id: appTransId,
        embed_data: JSON.stringify(embedData),
        item: JSON.stringify(items),
        description: orderData.description,
        bank_code: 'CC', // Credit card for web gateway
        mac: mac,
        callback_url: this.config.callbackUrl,
        return_url: `${this.config.returnUrl}?apptransid=${appTransId}&orderId=${orderData.embedData?.orderId || orderData.orderId}`
      };

      console.log('ZaloPay request:', {
        ...requestData,
        mac: mac.substring(0, 10) + '...' // Log partial MAC for security
      });

      // Send request to ZaloPay
      const response = await axios.post(
        `${this.config.endpoint}/v2/create`,
        new URLSearchParams(requestData as any).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      console.log('ZaloPay response:', response.data);

      const result: ZaloPayCreateOrderResponse = response.data;

      // Store app_trans_id for tracking
      (result as any).app_trans_id = appTransId;

      return result;
    } catch (error: any) {
      console.error('ZaloPay create order error:', error.response?.data || error.message);
      throw new Error(`ZaloPay order creation failed: ${error.response?.data?.return_message || error.message}`);
    }
  }

  /**
   * Query order status
   */
  async queryOrder(appTransId: string): Promise<ZaloPayQueryOrderResponse> {
    try {
      const macData = `${this.config.appId}|${appTransId}|${this.config.key1}`;
      const mac = this.generateMac(macData, this.config.key1);

      const requestData = {
        app_id: this.config.appId,
        app_trans_id: appTransId,
        mac: mac
      };

      console.log('ZaloPay query request:', requestData);

      const response = await axios.post(
        `${this.config.endpoint}/v2/query`,
        new URLSearchParams(requestData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      console.log('ZaloPay query response:', response.data);

      // Handle sandbox specific responses
      if (response.data.return_code === 2 && response.data.sub_return_code === -377) {
        console.log('⚠️ ZaloPay sandbox error -377: Transaction not executed in sandbox');
        return {
          ...response.data,
          sandbox_note: 'This is a sandbox environment error. In production, this would be a real payment status.'
        };
      }

      return response.data;
    } catch (error: any) {
      console.error('ZaloPay query order error:', error.response?.data || error.message);
      throw new Error(`ZaloPay query failed: ${error.response?.data?.return_message || error.message}`);
    }
  }

  /**
   * Verify callback data
   */
  verifyCallback(callbackData: any): boolean {
    try {
      console.log('🔐 Starting callback verification...');
      const { data, mac } = callbackData;

      console.log('Callback data structure:', {
        hasData: !!data,
        hasMac: !!mac,
        dataType: typeof data,
        macType: typeof mac,
        dataLength: data ? data.length : 0,
        macLength: mac ? mac.length : 0
      });

      if (!data || !mac) {
        console.error('❌ Missing data or mac in callback');
        console.log('Available keys:', Object.keys(callbackData));
        return false;
      }

      console.log('🔑 Generating expected MAC with key2...');
      console.log('Data for MAC generation:', data);
      console.log('Key2 (first 10 chars):', this.config.key2.substring(0, 10) + '...');

      const expectedMac = this.generateMac(data, this.config.key2);
      const isValid = mac === expectedMac;

      console.log('🔍 MAC Verification Details:', {
        receivedMac: mac,
        expectedMac: expectedMac,
        receivedMacLength: mac.length,
        expectedMacLength: expectedMac.length,
        isValid: isValid,
        macMatch: mac === expectedMac
      });

      if (!isValid) {
        console.error('❌ MAC verification failed!');
        console.log('Received MAC:', mac);
        console.log('Expected MAC:', expectedMac);
      } else {
        console.log('✅ MAC verification successful!');
      }

      return isValid;
    } catch (error) {
      console.error('❌ Callback verification error:', error);
      return false;
    }
  }

  /**
   * Parse callback data
   */
  parseCallbackData(callbackData: any): any {
    try {
      const { data } = callbackData;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing callback data:', error);
      return null;
    }
  }

  /**
   * Create refund request
   */
  async createRefund(refundData: {
    zpTransId: string;
    amount: number;
    description: string;
  }): Promise<any> {
    try {
      const timestamp = this.getTimestamp();
      const uid = `${timestamp}${Math.floor(Math.random() * 1000)}`;

      const macData = `${this.config.appId}|${refundData.zpTransId}|${refundData.amount}|${refundData.description}|${timestamp}`;
      const mac = this.generateMac(macData, this.config.key1);

      const requestData = {
        app_id: this.config.appId,
        zp_trans_id: refundData.zpTransId,
        amount: refundData.amount.toString(),
        description: refundData.description,
        timestamp: timestamp.toString(),
        uid: uid,
        mac: mac
      };

      console.log('ZaloPay refund request:', requestData);

      const response = await axios.post(
        `${this.config.endpoint}/v2/refund`,
        new URLSearchParams(requestData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      console.log('ZaloPay refund response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('ZaloPay refund error:', error.response?.data || error.message);
      throw new Error(`ZaloPay refund failed: ${error.response?.data?.return_message || error.message}`);
    }
  }
}

// Create singleton instance
const zaloPayConfig: ZaloPayConfig = {
  appId: process.env.ZALOPAY_APP_ID || '2553',
  key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
  key2: process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn',
  callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:3000/api/orders/zalopay/callback',
  returnUrl: process.env.ZALOPAY_RETURN_URL || 'http://localhost:3000/orders/payment-result'
};


export const zaloPayService = new ZaloPayService(zaloPayConfig);
export default zaloPayService;
