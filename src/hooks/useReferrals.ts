import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export const useReferrals = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) return;

        const q = query(
            collection(db, 'referrals'),
            where("referrerEmail", "==", user.email.toLowerCase().trim())
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReferrals(data);
                setLoading(false);
            },
            (error) => {
                console.error("Erro no listener de indicações:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.email]);

    const stats = {
        totalEarnedDays: referrals.filter(r => r.status === 'COMPLETED').length * 30,
        pendingCount: referrals.filter(r => r.status === 'PENDING_PAYMENT').length,
        completedCount: referrals.filter(r => r.status === 'COMPLETED').length
    };

    return { referrals, stats, loading };
};