import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Building2,
    Stethoscope,
    Dog,
    FileText,
    Menu,
    X
} from "lucide-react";

interface SidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const navItems = [
    { to: "/clinics", label: "Clinics", icon: Building2 },
    { to: "/veterinarians", label: "Veterinarians", icon: Stethoscope },
    { to: "/patients", label: "Patients", icon: Dog },
    { to: "/transcripts", label: "Transcripts", icon: FileText },
];

const Sidebar = ({ open, setOpen }: SidebarProps) => {
    const location = useLocation();

    const AppIcon = () => (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-md">
            <span className="text-2xl">🐾</span>
        </div>
    );

    return (
        <>
            {/* Sidebar container */}
            <aside
                className={`bg-white border-r border-blue-100 shadow-md w-20 flex-shrink-0 
          transform transition-transform duration-300 ease-in-out
          fixed md:static inset-y-0 left-0
          ${open ? "translate-x-0 z-40" : "-translate-x-full md:translate-x-0"}`}
            >
                {/* Logo */}
                <div className="flex flex-col items-center py-6">
                    <Link to="/" onClick={() => setOpen(false)}>
                        <AppIcon />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col items-center space-y-6 mt-4">
                    {navItems.map(({ to, label, icon: Icon }) => {
                        const active = location.pathname === to;
                        return (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setOpen(false)}
                                className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition
                  ${active ? "text-blue-700" : "text-gray-600 hover:bg-blue-50"}`}
                            >
                                <Icon size={22} />
                                <span className="text-[10px] mt-1">{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Overlay on mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;