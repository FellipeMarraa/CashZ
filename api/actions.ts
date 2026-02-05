import admin from "firebase-admin";

export default async function handler(req: any, res: any) {
    const { action, data, adminId } = req.body;

    const db = admin.firestore();

    const adminRef = db.collection("user_preferences").doc(adminId);
    const adminSnap = await adminRef.get();

    if (!adminSnap.exists || !adminSnap.data()?.isAdmin) {
        return res.status(403).json({ message: "Acesso proibido" });
    }

    try {
        if (action === "FORCE_ACTIVATE_BONUS") {
            const { referralId } = data;
            const refDoc = db.collection("referrals").doc(referralId);
            const refSnap = await refDoc.get();
            const refData = refSnap.data();

            if (!refData || refData.status === 'COMPLETED') throw new Error("Já concluído ou inexistente");

            await db.runTransaction(async (transaction) => {
                const referrerQuery = await db.collection("user_preferences")
                    .where("email", "==", refData.referrerEmail).limit(1).get();

                if (referrerQuery.empty) throw new Error("Padrinho não encontrado");

                const referrerDoc = referrerQuery.docs[0];
                const currentExp = new Date(referrerDoc.data().planExpiresAt || new Date());
                currentExp.setDate(currentExp.getDate() + 30);

                transaction.update(referrerDoc.ref, {
                    plan: 'premium',
                    planExpiresAt: currentExp.toISOString()
                });

                transaction.update(refDoc, {
                    status: 'COMPLETED',
                    bonusApplied: true,
                    manualActivation: true,
                    activatedBy: adminId
                });

                const logRef = db.collection("admin_logs").doc();
                transaction.set(logRef, {
                    action: "BÔNUS MANUAL",
                    details: `Bônus ativado para ${refData.referrerEmail} (Referência: ${referralId})`,
                    adminId,
                    createdAt: new Date().toISOString()
                });
            });

            return res.status(200).json({ success: true });
        }

        if (action === "SEND_GLOBAL_NOTIFICATION") {
            const {title, message, type, scheduledAt} = data;

            if (scheduledAt) {
                await db.collection("scheduled_notifications").add({
                    title,
                    message,
                    type: type || "INFO",
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    status: "PENDING",
                    adminId,
                    createdAt: new Date().toISOString()
                });

                await db.collection("admin_logs").add({
                    action: "NOTIFICAÇÃO AGENDADA",
                    details: `Agendada para ${new Date(scheduledAt).toLocaleString('pt-BR')}: "${title}"`,
                    adminId,
                    createdAt: new Date().toISOString()
                });

                return res.status(200).json({success: true, message: "Notificação agendada."});
            }
        }
    } catch (e: any) {
        console.error("Erro Admin Action:", e.message);
        return res.status(500).json({ error: e.message });
    }
}