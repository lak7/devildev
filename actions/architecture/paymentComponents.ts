import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

const prompt = PromptTemplate.fromTemplate(`
  You are a senior fintech and payment systems architect. Analyze the requirement and return ONLY payment components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 IDEAL PAYMENT STACK (USE BY DEFAULT):**
  - Gateway: Stripe (best all-around, global markets)
  - Subscriptions: Stripe Billing (usage-based, trials, coupons)
  - Marketplace: Stripe Connect (split payouts, compliance)
  - Tax: Stripe Tax (custom control) or Paddle (hands-off)
  - Indian Market: Razorpay (UPI, cards, recurring)
  - Crypto: Coinbase Commerce (optional)
  
  **COMPONENT SELECTION RULES:**
  Include ONLY components that are required as per conversation history or explicitly mentioned or strongly implied:
  - "payment" or "checkout" → Payment Gateway
  - "subscription" or "recurring" → Subscription Management
  - "marketplace" or "split payment" → Marketplace Payments
  - "tax" or "VAT" or "GST" → Tax Calculation
  - "invoice" → Invoice Generation
  - "crypto" or "bitcoin" → Crypto Payments
  - "mobile payment" → Mobile Payment APIs
  - If general "payments" mentioned → Include Payment Gateway only
  
  **TECHNOLOGY SELECTION:**
  
  **Payment Gateways:**
  - If requirement mentions "Stripe" → Use Stripe
  - If requirement mentions "India" or "UPI" → Use Razorpay
  - If requirement mentions "Razorpay" → Use Razorpay
  - If requirement mentions "PayPal" → Use PayPal
  - If requirement mentions "Cashfree" → Use Cashfree
  - If requirement mentions "Square" → Use Square
  - If requirement mentions "SaaS" + "tax compliance" → Use Paddle
  - If requirement mentions "Europe" → Use Mollie or Adyen
  - Otherwise → Use Stripe (ideal choice)
  
  **Subscription Management:**
  - If using Paddle → Use Paddle (built-in)
  - If using Stripe → Use Stripe Billing
  - If using Razorpay → Use Razorpay Subscriptions
  - Otherwise → Use Stripe Billing
  
  **Mobile Payments:**
  - If requirement mentions "iOS" or "Apple" → Include Apple Pay
  - If requirement mentions "Android" or "Google" → Include Google Pay
  - If requirement mentions "India" + "mobile" → Include PhonePe/Paytm SDKs
  
  **Crypto Payments:**
  - If requirement mentions "Coinbase" → Use Coinbase Commerce
  - If requirement mentions "BitPay" → Use BitPay
  - If requirement mentions "multi-coin" → Use NOWPayments
  - Otherwise → Use Coinbase Commerce
  
  **AVAILABLE PAYMENT TECHNOLOGIES:**
  
  **Payment Gateways:**
  **Stripe** (DEFAULT) - Most developer-friendly, global, subscriptions, invoicing
  **Razorpay** - Leading Indian gateway, UPI/card support, great for India
  **PayPal** - Global peer-to-peer and business transactions
  **Cashfree** - Indian payment API, payouts and marketplace flow
  **Square** - Physical + online payments, POS systems
  **Paddle** - SaaS-focused with built-in tax compliance
  **Braintree** - PayPal-owned, global cards/wallets, subscriptions
  **Mollie/Adyen** - European-focused, SEPA, iDEAL, Klarna
  
  **Mobile Payment APIs:**
  **Apple Pay** - Seamless iOS checkout
  **Google Pay** - Android and UPI integration (India)
  **PhonePe/Paytm SDKs** - Popular Indian wallet/UPI transactions
  
  **Crypto Payment Providers:**
  **Coinbase Commerce** - Multi-crypto (BTC, ETH, USDC) with wallet deposits
  **NOWPayments** - Multi-coin with fiat settlement option
  **BitPay** - Bitcoin/crypto with fiat or crypto settlement
  
  **Specialized Features:**
  **Stripe Connect** - Marketplace payments and split payouts
  **Stripe Billing** - Advanced subscription management
  **Stripe Tax** - Global tax compliance
  **Paddle** - All-in-one SaaS billing with tax handling
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Component Name",
        "type": "payment",
        "purpose": "Component purpose and payment capability",
        "technologies": {{
          "primary": "Selected Payment Provider",
          "integration": "SDK/API method",
          "features": "Key payment features",
          "region": "global|india|europe|crypto",
          "additional": "Supporting tools if needed"
        }}
      }}
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Check for explicit payment features** mentioned in requirement
  2. **Include only payment components** that are specifically needed
  3. **Consider regional requirements** (India → Razorpay, Europe → Mollie)
  4. **Choose technologies** based on explicit mentions or ideal stack
  5. **Match payment capabilities** to business model (SaaS, marketplace, etc.)
  
  Return only the JSON with the specifically needed payment components.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const paymentComponentsTool = new DynamicStructuredTool({
  name: "payment_components",
  description: "To generate payment processing and financial architecture components including payment gateways (Stripe, Razorpay, PayPal), checkout systems, subscription billing, UPI, invoice management, fraud detection, PCI compliance infrastructure, multi-currency support, refund/dispute handling, payment webhooks, financial reporting, tax calculation, and wallet integration. Use when requirements mention payments, e-commerce, subscriptions, billing, checkout, transactions, monetization, or financial operations.",
  schema: z.object({
    requirement: z.string().describe("User's payment system requirement"),
    conversation_history: z.string().describe("All prior conversation messages as a single formatted string"),
    architectureData: z.string().describe("Previous architecture as stringified JSON if any"),
  }),
  func: async ({ requirement, conversation_history, architectureData }) => {
    const result = await chain.invoke({
      requirement,
      conversation_history,
      architectureData,
    });
    return result;
  },
}); 