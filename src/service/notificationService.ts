import { collection, addDoc } from "firebase/firestore";
import {db} from "../../firebase.ts";

export const sendNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO',
    linkTo: string | null = null
) => {
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            title,
            message,
            type,
            linkTo,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Erro ao enviar notificação: ", e);
    }
};