import { Edit, Trash2 } from "lucide-react";


interface EntityCardProps {
    avatar?: string;
    title: string;
    subtitle?: string;
    onEdit: () => void;
    onDelete?: () => void;
    status?: string;
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
};

export const EntityCard: React.FC<EntityCardProps> = ({
    avatar = "🏥",
    title,
    subtitle,
    onEdit,
    onDelete,
    status
}) => {
    const statusColor = status ? statusColors[status] : undefined;

    return (
        <div className="flex items-center bg-white rounded-xl shadow p-4 border border-blue-100 relative max-w-xs w-full h-[100px]">
            {/* Status badge (top right) */}
            {status && (
                <span
                    className={`absolute top-2 right-3 px-2 py-0.5 rounded-full text-xs font-medium z-10 ${statusColor || "bg-gray-100 text-gray-700"}`}
                >
                    {status}
                </span>
            )}
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-2xl flex-shrink-0">
                {avatar.startsWith("http") ? (
                    <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    avatar
                )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate">{title}</div>
                {subtitle && <div className="text-gray-500 text-sm truncate">{subtitle}</div>}
            </div>
            {/* Actions */}
            <div className="flex gap-2">
                <button
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    <Edit size={18} />
                </button>
                {onDelete && (
                    <button
                        className="text-gray-500 hover:text-red-600"
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};