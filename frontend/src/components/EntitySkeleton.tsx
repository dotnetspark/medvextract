export const EntitySkeleton = () => (
    <div className="animate-pulse flex items-center bg-white rounded-xl shadow p-4 border border-blue-100">
        <div className="w-12 h-12 rounded-full bg-gray-200 mr-3" />
        <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
    </div>
);