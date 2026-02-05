import admin from "firebase-admin";

export default async function handler(req: any, res: any) {
    const db = admin.firestore();

    // Proteção básica para garantir que apenas a cron autorizada chame
    // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) { return res.status(401).end(); }

    const configRef = db.collection("system_configs").doc("notifications");
    const configSnap = await configRef.get();

    if (!configSnap.exists || configSnap.data()?.isCronActive === false) {
        return res.status(200).send("Job desabilitado manualmente no banco de dados.");
    }

    const now = new Date().toISOString();

    try {
        const pendingSnap = await db.collection("scheduled_notifications")
            .where("status", "==", "PENDING")
            .where("scheduledAt", "<=", now)
            .limit(1)
            .get();

        if (pendingSnap.empty) return res.status(200).send("Sem agendamentos para agora.");

        const jobDoc = pendingSnap.docs[0];
        const { title, message, type } = jobDoc.data();

        await jobDoc.ref.update({ status: "PROCESSING" });

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
            if (count === 500) {
                await batch.commit();
                batch = db.batch();
                count = 0;
            }
        }
        if (count > 0) await batch.commit();

        await jobDoc.ref.update({
            status: "COMPLETED",
            completedAt: new Date().toISOString()
        });

        await db.collection("admin_logs").add({
            action: "CRON EXECUTADA",
            details: `Agendamento "${title}" disparado para ${usersSnap.docs.length} usuários.`,
            createdAt: new Date().toISOString(),
            adminId: "SYSTEM_CRON"
        });

        return res.status(200).send("Notificação enviada.");
    } catch (e: any) {
        return res.status(500).send(e.message);
    }
}