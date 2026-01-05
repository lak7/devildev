"use server"

import DodoPayments from 'dodopayments';

const client = new DodoPayments({
bearerToken: process.env['DODO_PAYMENTS_API_KEY'], // This is the default and can be omitted
});

export async function createSubscription() {

    const productId = process.env.DODO_PRODUCT_ID;
    if (!productId) {
        throw new Error('DODO_PRODUCT_ID is not set');
    }


const subscription = await client.subscriptions.create({
billing: { city: 'N/A',
    country: 'IN',
    state: 'N/A',
    street: 'N/A',
    zipcode: "00000" },
customer: { customer_id: 'customer_id' },
product_id: productId,
payment_link: true,
return_url: 'https://rested-anchovy-mistakenly.ngrok-free.app/success',
quantity: 1,
});

;
}
