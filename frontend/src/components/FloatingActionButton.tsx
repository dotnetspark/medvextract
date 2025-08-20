import { Plus } from 'lucide-react';

export const FloatingActionButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
    >
        <Plus size={28} />
    </button>
);