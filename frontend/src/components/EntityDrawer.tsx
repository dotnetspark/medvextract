import { Loader } from "lucide-react";

interface EntityDrawerProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSaving?: boolean;
    children: React.ReactNode;
}

export const EntityDrawer: React.FC<EntityDrawerProps> = ({
    title,
    isOpen,
    onClose,
    onSubmit,
    isSaving,
    children
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            <div
                className="fixed inset-0 bg-black bg-opacity-30"
            />
            <div className="ml-auto w-full sm:w-[420px] bg-white h-full shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between sticky top-0">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
                </div>
                {/* Content */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {children}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-blue-700 transition flex items-center"
                            disabled={isSaving}
                        >
                            {isSaving && <Loader size={16} className="animate-spin mr-2" />}
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};