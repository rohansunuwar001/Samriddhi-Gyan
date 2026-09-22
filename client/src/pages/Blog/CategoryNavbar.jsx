import PropTypes from 'prop-types';

const CategoriesNavBar = ({ categories, selectedCategory, onSelectCategory }) => (
    <nav className="sticky top-0 z-40 bg-gray-900 text-white shadow-md">
        <div className="container mx-auto px-6">
            <div className="flex items-center h-16 space-x-6 overflow-x-auto">
                <button
                    onClick={() => onSelectCategory('All')}
                    className={`px-3 py-2 text-lg font-extralight rounded-md whitespace-nowrap ${selectedCategory === 'All' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                >
                    All
                </button>
                {categories.map(category => (
                    <button
                        key={category._id}
                        onClick={() => onSelectCategory(category.name)}
                        className={`px-3 py-2 text-lg font-extralight rounded-md whitespace-nowrap ${selectedCategory === category.name ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    </nav>
);

CategoriesNavBar.propTypes = {
    categories: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            slug: PropTypes.string,
        })
    ).isRequired,
    selectedCategory: PropTypes.string.isRequired,
    onSelectCategory: PropTypes.func.isRequired,
};

export default CategoriesNavBar;
