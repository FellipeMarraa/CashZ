import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log("? Firebase Admin conectado");
    } catch (error: any) {
        console.error("? Erro na inicialização:", error.message);
    }
}

const adminDb = admin.firestore();
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
});

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { data, type } = req.body;

        if (type === 'payment') {
            const payment = new Payment(client);
            const p = await payment.get({ id: data.id });

            if (p.status === 'approved') {
                const userId = p.external_reference;
                const amount = p.transaction_amount;

                if (!userId) {
                    console.error("? Erro: external_reference (userId) não encontrado.");
                    return res.status(400).json({ error: "Missing external_reference" });
                }

                const planType = amount && amount > 50 ? 'annual' : 'premium';
                const daysToAdd = planType === 'annual' ? 365 : 30;

                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + daysToAdd);

                await adminDb.collection("user_preferences").doc(userId).set({
                    plan: planType,
                    planExpiresAt: expirationDate.toISOString(),
                    lastPaymentId: data.id,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`? Plano ${planType} ativado com sucesso para o UID: ${userId}`);
            }
        }

        return res.status(200).send('OK');

    } catch (error: any) {
        console.error('? Webhook Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}