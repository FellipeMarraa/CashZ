import admin from "firebase-admin";

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
    const db = admin.firestore();

    // 1. Verificação de Interruptor Manual
    const configRef = db.collection("system_configs").doc("notifications");
    const configSnap = await configRef.get();

    if (!configSnap.exists || configSnap.data()?.isCronActive === false) {
        return res.status(200).send("Job desabilitado manualmente no banco de dados.");
    }

    const now = new Date().toISOString();

    try {
        // 2. Busca TODOS os agendamentos que já deveriam ter sido enviados
        const pendingSnap = await db.collection("scheduled_notifications")
            .where("status", "==", "PENDING")
            .where("scheduledAt", "<=", now)
            .orderBy("scheduledAt", "asc")
            .get();

        if (pendingSnap.empty) return res.status(200).send("Sem agendamentos pendentes para este momento.");

        // 3. Processa cada agendamento da fila
        for (const jobDoc of pendingSnap.docs) {
            const { title, message, type } = jobDoc.data();

            try {
                // Marcar como processando para evitar duplicidade
                await jobDoc.ref.update({ status: "PROCESSING" });

                // Buscar todos os usuários para envio
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
                        read: false,
                        createdAt: new Date().toISOString()
                    });

                    count++;

                    // Firestore suporta no máximo 500 operações por batch
                    if (count === 500) {
                        await batch.commit();
                        batch = db.batch();
                        count = 0;
                    }
                }

                if (count > 0) await batch.commit();

                // Finalizar o Job com sucesso
                await jobDoc.ref.update({
                    status: "COMPLETED",
                    completedAt: new Date().toISOString(),
                    totalUsersNotified: usersSnap.docs.length
                });

                // Registrar na auditoria
                await db.collection("admin_logs").add({
                    action: "DISPARO CONCLUÍDO",
                    details: `Notificação "${title}" enviada para ${usersSnap.docs.length} usuários via Cron.`,
                    createdAt: new Date().toISOString(),
                    adminId: "SYSTEM_CRON"
                });

            } catch (jobError: any) {
                console.error(`Erro ao processar job ${jobDoc.id}:`, jobError);
                await jobDoc.ref.update({
                    status: "ERROR",
                    errorDetails: jobError.message
                });
            }
        }

        return res.status(200).send(`Processamento concluído. ${pendingSnap.size} agendamento(s) tratado(s).`);

    } catch (e: any) {
        console.error("Erro Crítico na Cron:", e.message);
        return res.status(500).send(e.message);
    }
}