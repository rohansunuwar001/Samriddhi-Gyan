import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ArticleCard = ({ article, size }) => (
    // Add motion properties for entry, exit, and hover animations
    <motion.div
        layout // This helps AnimatePresence smoothly re-order items
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-lg h-full flex flex-col border border-gray-200 dark:border-gray-700"
    >
        <Link to={`/blog/${article.slug}`} className="flex flex-col flex-grow p-6">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{article.category}</p>
            <h3 className={`${size === 'large' ? 'text-xl md:text-2xl' : 'text-lg'} font-bold text-gray-900 dark:text-white leading-tight flex-grow`}>
                {article.title}
            </h3>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <img src={article.author.avatar} alt={article.author.name} className="w-8 h-8 rounded-full" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{article.author.name}</span>
                </div>
            </div>
        </Link>
    </motion.div>
);

// PropTypes and DefaultProps remain the same
ArticleCard.propTypes = {
    article: PropTypes.shape({
        id: PropTypes.number.isRequired,
        slug: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        author: PropTypes.shape({
            name: PropTypes.string.isRequired,
            avatar: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    size: PropTypes.oneOf(['small', 'large']),
};
ArticleCard.defaultProps = {
    size: 'small',
};

export default ArticleCard;