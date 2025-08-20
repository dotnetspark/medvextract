import { Menu, ChevronDown, Search } from 'lucide-react';
import { useTaskStore } from '../store';

interface GlobalHeaderProps {
    onHamburger: () => void;
}

const GlobalHeader = ({ onHamburger }: GlobalHeaderProps) => {
    const { query, setQuery } = useTaskStore();

    return (
        <header className="w-full bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20">

            {/* Left: Hamburger on mobile */}
            <div className="flex items-center">
                <button
                    className="text-gray-700 md:hidden mr-3"
                    onClick={onHamburger}
                >
                    <Menu size={22} />
                </button>

                {/* Search box */}
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-full max-w-sm">
                    <Search size={16} className="text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent w-full outline-none px-2 text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Right: User */}
            <div className="flex items-center gap-2 ml-4 cursor-pointer">
                <img
                    src="https://ui-avatars.com/api/?name=John+Doe"
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700">
                    John Doe
                </span>
                <ChevronDown size={16} className="text-gray-500" />
            </div>
        </header>
    );
};

export default GlobalHeader;