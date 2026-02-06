import React, { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext({
    isPrivate: false,
    togglePrivacy: () => {},
});

export const PrivacyProvider = ({ children }: { children: React.ReactNode }) => {
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('cashz_privacy_mode') === 'true';
        setIsPrivate(saved);
    }, []);

    const togglePrivacy = () => {
        setIsPrivate(prev => {
            localStorage.setItem('cashz_privacy_mode', String(!prev));
            return !prev;
        });
    };

    return (
        <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
};

export const usePrivacy = () => useContext(PrivacyContext);