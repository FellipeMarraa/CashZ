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
            const { title, message, type, scheduledAt } = data;

            // Se não houver data agendada, usamos a data atual (disparo imediato via Cron)
            const targetDate = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();

            // Apenas criamos um documento na fila. Isso é instantâneo e evita Erro 500/Timeout.
            await db.collection("scheduled_notifications").add({
                title,
                message,
                type: type || "INFO",
                scheduledAt: targetDate,
                status: "PENDING",
                adminId,
                createdAt: new Date().toISOString(),
                isImmediate: !scheduledAt // Identifica que você clicou em "Disparar Agora"
            });

            await db.collection("admin_logs").add({
                action: scheduledAt ? "NOTIFICAÇÃO AGENDADA" : "NOTIFICAÇÃO IMEDIATA (FILA)",
                details: `Título: "${title}" enviado para a fila de processamento.`,
                adminId,
                createdAt: new Date().toISOString()
            });

            return res.status(200).json({
                success: true,
                message: "Notificação enviada para a fila com sucesso."
            });
        }

        if (action === "BAN_USER") {
            const { targetUserId } = data;
            const userRef = db.collection("user_preferences").doc(targetUserId);
            const userSnap = await userRef.get();
            const isCurrentlyBanned = userSnap.data()?.isBanned || false;

            await userRef.update({ isBanned: !isCurrentlyBanned });

            await db.collection("admin_logs").add({
                action: isCurrentlyBanned ? "DESBANIMENTO" : "BANIMENTO",
                details: `Usuário ID: ${targetUserId} foi ${isCurrentlyBanned ? 'liberado' : 'bloqueado'}.`,
                adminId,
                createdAt: new Date().toISOString()
            });

            return res.status(200).json({ success: true });
        }

        if (action === "RESET_CATEGORIES") {
            const { targetUserId } = data;
            const categoriesSnap = await db.collection("categories").where("userId", "==", targetUserId).get();

            const batch = db.batch();
            categoriesSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            await db.collection("admin_logs").add({
                action: "RESET DADOS",
                details: `Categorias do usuário ID: ${targetUserId} foram resetadas para o padrão.`,
                adminId,
                createdAt: new Date().toISOString()
            });

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

            await db.collection("admin_logs").add({
                action: "LIMPEZA DE ERROS",
                details: `${logsSnap.size} registros de erro apagados.`,
                adminId,
                createdAt: new Date().toISOString()
            });

            return res.status(200).json({ success: true });
        }
    } catch (e: any) {
        console.error("Erro Admin Action:", e.message);
        return res.status(500).json({ error: e.message });
    }
}