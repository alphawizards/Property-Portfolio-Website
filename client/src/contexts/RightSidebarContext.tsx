import React, { createContext, useContext, ReactNode } from "react";

export interface RightSidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggleSidebar: () => void;
    content: ReactNode | null;
    setContent: (content: ReactNode | null) => void;
}

export const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

export function useRightSidebar() {
    const context = useContext(RightSidebarContext);
    if (context === undefined) {
        throw new Error("useRightSidebar must be used within a RightSidebarProvider (in DashboardLayout)");
    }
    return context;
}
