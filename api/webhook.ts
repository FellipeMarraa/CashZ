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
    } catch (error: any) {
        console.error("❌ Erro na inicialização:", error.message);
    }
}

const adminDb = admin.firestore();
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
});

async function sendAdminNotification(userId: string, title: string, message: string, type: string) {
    try {
        await adminDb.collection("notifications").add({
            userId,
            title,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Erro ao enviar notificação administrativa:", error);
    }
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { data, type, action } = req.body;

        if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            const paymentId = data?.id || req.body?.data?.id;
            if (!paymentId) return res.status(200).send('OK');

            const payment = new Payment(client);
            const p = await payment.get({ id: Number(paymentId) });

            if (p.status === 'approved') {
                const userId = p.external_reference;
                const amount = p.transaction_amount;

                if (!userId) {
                    console.error("❌ Erro: external_reference (userId) não encontrado.");
                    return res.status(200).send('OK');
                }

                const planType = amount && amount > 50 ? 'annual' : 'premium';
                const daysToAdd = planType === 'annual' ? 365 : 30;

                const userRef = adminDb.collection("user_preferences").doc(userId);
                const userDoc = await userRef.get();

                let startDate = new Date();
                if (userDoc.exists) {
                    const currentData = userDoc.data();
                    if (currentData?.planExpiresAt) {
                        const currentExp = new Date(currentData.planExpiresAt);
                        if (currentExp > startDate) startDate = currentExp;
                    }
                }

                const expirationDate = new Date(startDate);
                expirationDate.setDate(expirationDate.getDate() + daysToAdd);

                await userRef.set({
                    plan: planType,
                    planExpiresAt: expirationDate.toISOString(),
                    lastPaymentId: String(paymentId),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`✅ Plano ${planType} ativado`);

                const referralRef = adminDb.collection("referrals").doc(userId);
                const referralSnap = await referralRef.get();

                if (referralSnap.exists && referralSnap.data()?.status === 'PENDING_PAYMENT') {
                    const referralData = referralSnap.data();
                    const referrerEmail = referralData?.referrerEmail.toLowerCase().trim();
                    const payerEmail = p.payer?.email?.toLowerCase().trim();

                    if (referrerEmail === payerEmail) {
                        console.warn(`⚠️ Tentativa de auto-indicação detectada`);
                        return res.status(200).send('OK');
                    }

                    const referrerQuery = await adminDb.collection("user_preferences")
                        .where("email", "==", referrerEmail)
                        .limit(1)
                        .get();

                    if (!referrerQuery.empty) {
                        const referrerDoc = referrerQuery.docs[0];
                        const referrerId = referrerDoc.id;
                        const referrerData = referrerDoc.data();

                        let refStartDate = new Date();
                        if (referrerData?.planExpiresAt) {
                            const currentRefExp = new Date(referrerData.planExpiresAt);
                            if (currentRefExp > refStartDate) refStartDate = currentRefExp;
                        }

                        const newRefExpiration = new Date(refStartDate);
                        newRefExpiration.setDate(newRefExpiration.getDate() + 30);

                        await referrerDoc.ref.set({
                            plan: 'premium',
                            planExpiresAt: newRefExpiration.toISOString(),
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });

                        await referralRef.update({
                            status: 'COMPLETED',
                            bonusApplied: true,
                            completedAt: admin.firestore.FieldValue.serverTimestamp(),
                            paymentId: String(paymentId)
                        });

                        const friendLabel = userDoc.data()?.email || "Um amigo";
                        await sendAdminNotification(
                            referrerId,
                            "Bônus de Indicação! 🎉",
                            `Sua indicação para ${friendLabel} foi concluída. Você ganhou +30 dias de Premium!`,
                            "SUCCESS"
                        );

                        console.log(`🎁 Bônus aplicado para o padrinho: ${referrerId}`);
                    }
                }
            }
        }

        return res.status(200).send('OK');

    } catch (error: any) {
        console.error('❌ Webhook Error:', error.message);
        return res.status(200).send('Erro processado');
    }
}