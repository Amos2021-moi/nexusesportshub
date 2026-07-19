import axios from "axios"

interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export class SafaricomService {
  private consumerKey: string
  private consumerSecret: string
  private passkey: string
  private shortcode: string
  private environment: string
  private baseUrl: string
  private token: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || ""
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || ""
    this.passkey = process.env.MPESA_PASSKEY || ""
    this.shortcode = process.env.MPESA_SHORTCODE || "174379"
    this.environment = process.env.MPESA_ENVIRONMENT || "sandbox"

    this.baseUrl = this.environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke"

    console.log('🔑 MPESA_ENVIRONMENT:', this.environment)
    console.log('🔑 MPESA_CONSUMER_KEY exists:', !!this.consumerKey)
    console.log('🔑 MPESA_CONSUMER_SECRET exists:', !!this.consumerSecret)
    console.log('🔑 MPESA_PASSKEY exists:', !!this.passkey)
  }

  async getAccessToken(): Promise<string> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64")

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 10000,
        }
      )

      const newToken = response.data.access_token

      if (!newToken) {
        throw new Error("Failed to get access token - no token returned")
      }

      this.token = newToken
      this.tokenExpiry = new Date(Date.now() + 3500 * 1000)

      return newToken

    } catch (error: any) {
      console.error('Error getting access token:', error.response?.data || error.message)
      throw new Error(error.response?.data?.errorMessage || "Failed to authenticate with M-Pesa")
    }
  }

  async sendSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string = "Competition Entry Fee"
  ): Promise<STKPushResponse> {
    try {
      const token = await this.getAccessToken()

      const formattedPhone = phoneNumber.replace(/^0+/, "254")

      const timestamp = this.getCurrentTimestamp()
      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`
      ).toString("base64")

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL || "https://your-domain.com/api/mpesa/callback",
        AccountReference: accountReference.slice(0, 12),
        TransactionDesc: transactionDesc.slice(0, 36),
      }

      const response = await axios.post<STKPushResponse>(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      )

      if (response.data.ResponseCode !== "0") {
        throw new Error(response.data.ResponseDescription || "STK Push failed")
      }

      return response.data

    } catch (error: any) {
      console.error('Error sending STK Push:', error.response?.data || error.message)

      if (error.response?.data?.errorCode) {
        throw new Error(`M-Pesa Error (${error.response.data.errorCode}): ${error.response.data.errorMessage}`)
      }

      throw new Error(error.response?.data?.errorMessage || "Failed to send STK Push")
    }
  }

  async querySTKStatus(checkoutRequestID: string): Promise<any> {
    try {
      const token = await this.getAccessToken()

      const timestamp = this.getCurrentTimestamp()
      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`
      ).toString("base64")

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      }

      console.log(`📊 Querying STK status for: ${checkoutRequestID}`)

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      )

      console.log(`📊 STK Query Response:`, JSON.stringify(response.data, null, 2))

      // ✅ If response has ResultCode, return it
      if (response.data?.ResultCode !== undefined) {
        return response.data
      }

      // ✅ If no ResultCode, return pending
      return {
        ResultCode: 2001,
        ResultDesc: "STK Push sent, waiting for customer",
      }

    } catch (error: any) {
      console.error('Error querying STK status:', error.response?.data || error.message)
      
      // ✅ On error, return pending with status 2001 (waiting for customer)
      return {
        ResultCode: 2001,
        ResultDesc: "STK Push sent, waiting for customer confirmation",
      }
    }
  }

  private getCurrentTimestamp(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }
}

export const safaricomService = new SafaricomService()