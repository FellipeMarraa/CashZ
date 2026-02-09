import admin from "firebase-admin";

// Inicialização necessária para rodar na Vercel
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

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
            const { title, message, type, scheduledAt, linkTo, targetEmail } = data;

            if (scheduledAt) {
                await db.collection("scheduled_notifications").add({
                    title,
                    message,
                    type: type || "INFO",
                    linkTo: linkTo || null, // Incluído linkTo no agendamento
                    targetEmail: targetEmail || null, // Incluído para a CRON saber se é específico
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    status: "PENDING",
                    adminId,
                    createdAt: new Date().toISOString()
                });

                return res.status(200).json({ success: true, message: "Notificação agendada." });
            }

            // 2. LÓGICA DE ENVIO IMEDIATO

            // SE FOR PARA USUÁRIO ESPECÍFICO
            if (targetEmail) {
                const userQuery = await db.collection("user_preferences")
                    .where("email", "==", targetEmail.toLowerCase().trim())
                    .limit(1)
                    .get();

                if (userQuery.empty) {
                    return res.status(404).json({ message: "Usuário não encontrado para este e-mail." });
                }

                const targetUserDoc = userQuery.docs[0];

                await db.collection("notifications").add({
                    userId: targetUserDoc.id,
                    title,
                    message,
                    type: type || "INFO",
                    linkTo: linkTo || null,
                    read: false,
                    createdAt: new Date().toISOString()
                });

                return res.status(200).json({ success: true, message: "Notificação enviada ao usuário específico." });
            }

            const usersSnap = await db.collection("user_preferences").get();
            let batch = db.batch();
            let count = 0;

            for (const userDoc of usersSnap.docs) {
                const notificationRef = db.collection("notifications").doc();
                batch.set(notificationRef, {
                    userId: userDoc.id,
                    title,
                    message,
                    type: type || "INFO",
                    linkTo: linkTo || null,
                    read: false,
                    createdAt: new Date().toISOString()
                });

                count++;
                if (count === 500) {
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                }
            }

            if (count > 0) await batch.commit();

            return res.status(200).json({
                success: true,
                message: `Notificação enviada para ${usersSnap.size} usuários.`
            });
        }

        if (action === "BAN_USER") {
            const { targetUserId } = data;
            const userRef = db.collection("user_preferences").doc(targetUserId);
            const userSnap = await userRef.get();
            const isCurrentlyBanned = userSnap.data()?.isBanned || false;
            await userRef.update({ isBanned: !isCurrentlyBanned });
            return res.status(200).json({ success: true });
        }

        if (action === "RESET_CATEGORIES") {
            const { targetUserId } = data;
            const categoriesSnap = await db.collection("categories").where("userId", "==", targetUserId).get();
            const batch = db.batch();
            categoriesSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            return res.status(200).json({ success: true });
        }

        if (action === "CLEAR_ERROR_LOGS") {
            const logsSnap = await db.collection("client_logs").get();
            if (logsSnap.empty) return res.status(200).json({ success: true });
            let batch = db.batch();
            let count = 0;
            for (const logDoc of logsSnap.docs) {
                batch.delete(logDoc.ref);
                count++;
                if (count === 500) {
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();
            return res.status(200).json({ success: true });
        }
    } catch (e: any) {
        console.error("Erro Admin Action:", e.message);
        return res.status(500).json({ error: e.message });
    }
}