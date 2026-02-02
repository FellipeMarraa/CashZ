import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
});

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { userId, planType, price } = req.body;

        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: planType,
                        title: `CashZ - Plano ${planType}`,
                        quantity: 1,
                        unit_price: Number(price),
                        currency_id: 'BRL'
                    }
                ],
                external_reference: userId,
                notification_url: "https://cashz.vercel.app/api/webhook",
                back_urls: {
                    success: "https://cashz.vercel.app/",
                },
                auto_return: "approved",
            }
        });

        return res.status(200).json({ init_point: result.init_point });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}