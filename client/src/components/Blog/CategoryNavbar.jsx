import PropTypes from 'prop-types';

const CategoriesNavBar = ({ categories, selectedCategory, onSelectCategory }) => (
    <nav className="sticky top-0 z-40 bg-gray-900 text-white shadow-md">
        <div className="container mx-auto px-6">
            <div className="flex items-center h-16 space-x-6 overflow-x-auto">
                <button
                    onClick={() => onSelectCategory('All')}
                    className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${selectedCategory === 'All' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                >
                    All
                </button>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${selectedCategory === category ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    </nav>
);

// PropTypes for CategoriesNavBar
CategoriesNavBar.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedCategory: PropTypes.string.isRequired,
    onSelectCategory: PropTypes.func.isRequired,
};

export default CategoriesNavBar;