import React, { createContext, useContext, useState } from "react";

type ActiveDialog = "login" | "register" | "confirm-account" | "add-finance" | "edit-finance" | "delete-finance" | "all-notifications" | null;
interface DialogManagerContextProps {
    activeDialog: ActiveDialog;
    setActiveDialog: (dialog: ActiveDialog, source?: string) => void;
    dialogSource: string | null;
    setDialogSource: (source: string | null) => void;
}

const DialogManagerContext = createContext<DialogManagerContextProps>({
    activeDialog: null,
    setActiveDialog: () => {},
    dialogSource: null,
    setDialogSource: () => {},
});

export const useDialogManager = () => useContext(DialogManagerContext);

export const DialogManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeDialog, _setActiveDialog] = useState<ActiveDialog>(null);
    const [dialogSource, setDialogSource] = useState<string | null>(null);

    const setActiveDialog = (dialog: ActiveDialog, source?: string) => {
        _setActiveDialog(dialog);
        setDialogSource(source || null);
    };

    return (
        <DialogManagerContext.Provider
            value={{
                activeDialog,
                setActiveDialog,
                dialogSource,
                setDialogSource,
            }}
        >
            {children}
        </DialogManagerContext.Provider>
    );
};