import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ArticleCard from './ArticleCard'; // Ensure this path is correct
import { ChevronRight } from 'lucide-react';

const ArticleSection = ({ title, articles }) => {
    if (articles.length === 0) return null;
    const categorySlug = title.replace(' Articles', '').toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');

    return (
        <section className="container mx-auto px-6 py-16">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <Link to={`/blog/category/${categorySlug}`} className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                    See all {title.replace(' Articles', '')} articles
                </Link>
            </div>
            {/* The individual ArticleCard components will animate themselves */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 items-stretch">
                {articles.slice(0, 4).map(article => (
                    <div key={article.id} className="lg:col-span-1">
                        <ArticleCard article={article} />
                    </div>
                ))}
                {articles.length > 4 && (
                    <div className="hidden lg:flex items-center justify-center">
                        <Link to={`/blog/category/${categorySlug}`} className="flex items-center justify-center w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

ArticleSection.propTypes = {
    title: PropTypes.string.isRequired,
    articles: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ArticleSection;