import PropTypes from 'prop-types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

// --- Animation Libraries ---
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

// --- UI Components & Icons ---
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Share2 } from 'lucide-react';

// --- Shared Data Source ---
import { blogArticles } from '@/data/mockData';

//================================================================================
// 1. Reusable Sub-Components with PropTypes
//================================================================================

const Breadcrumbs = ({ category, title }) => (
  <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
    <Link to="/blog" className="hover:underline">Blog Home</Link>
    <ChevronRight className="h-4 w-4 mx-1" />
    <Link to={`/blog/category/${category?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="hover:underline">{category}</Link>
    <ChevronRight className="h-4 w-4 mx-1" />
    <span className="truncate max-w-[200px]">{title}</span>
  </nav>
);
Breadcrumbs.propTypes = {
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

const ArticleHeader = ({ category, title, lastUpdated }) => (
  <header className="mt-6">
    <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{category}</p>
    <h1 className="mt-2 text-4xl md:text-5xl font-bold font-serif text-gray-900 dark:text-white leading-tight">
      {title}
    </h1>
    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
      Page Last Updated: {lastUpdated}
    </p>
  </header>
);
ArticleHeader.propTypes = {
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  lastUpdated: PropTypes.string,
};

const AuthorInfo = ({ author }) => (
  <div className="my-8 flex items-center justify-between border-y border-gray-200 dark:border-gray-700 py-4">
    <div className="flex items-center gap-3">
      <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full" />
      <span className="font-semibold text-gray-800 dark:text-gray-200">{author.name}</span>
    </div>
    <button className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-600/50 dark:border-indigo-400/50 px-4 py-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
      Share this article
      <Share2 className="h-4 w-4" />
    </button>
  </div>
);
AuthorInfo.propTypes = {
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
  }).isRequired,
};

const ArticleBody = ({ content }) => {
  return content.map((item, index) => {
    switch (item.type) {
      case 'heading': {
        const Tag = `h${item.level}`;
        return <Tag key={index} className="text-2xl md:text-3xl font-bold font-serif text-gray-900 dark:text-white mt-10 mb-4">{item.text}</Tag>;
      }
      case 'paragraph':
        return <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{item.text}</p>;
      default:
        return null;
    }
  });
};
ArticleBody.propTypes = {
  content: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    text: PropTypes.string,
    level: PropTypes.number,
  })).isRequired,
};

const AuthorBio = ({ author }) => (
  <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6">
      <img src={author.avatar} alt={author.name} className="w-20 h-20 rounded-full flex-shrink-0" />
      <div>
        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{author.name}</h4>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{author.bio}</p>
        <div className="mt-4">
          <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Recent Articles by {author.name}</h5>
          <ul className="list-disc list-inside space-y-1">
            {author.recentArticles?.map(article => (
              <li key={article.id}>
                <Link to={`/blog/${article.slug}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{article.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);
AuthorBio.propTypes = {
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    bio: PropTypes.string,
    recentArticles: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })),
  }).isRequired,
};

//================================================================================
// 2. Main Single Blog Page Component
//================================================================================
const SingleBlogPage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const foundArticle = blogArticles.find(a => a.slug === slug);
      setArticle(foundArticle);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  useLayoutEffect(() => {
    if (article) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.delay(0.2)
          .from('.animate-breadcrumb', { opacity: 0, y: -20, duration: 0.5, ease: 'power3.out' })
          .from('.animate-header', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, "-=0.3")
          .from('.animate-author-info', { opacity: 0, duration: 0.5 }, "-=0.3")
          .from('.animate-body > *', { opacity: 0, y: 20, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, "-=0.2")
          .from('.animate-aside', { opacity: 0, x: 20, duration: 0.6, ease: 'power3.out' }, "<")
          .from('.animate-author-bio', { opacity: 0, y: 20, duration: 0.6 }, "-=0.5");
      }, componentRef);
      return () => ctx.revert();
    }
  }, [article]);

  if (loading) {
    return <SingleBlogSkeleton />;
  }

  if (!article) {
    return (
      <div className="text-center py-20 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">404 - Article Not Found</h1>
        <p className="mt-4 text-gray-600">Sorry, we couldn`t find the article you were looking for.</p>
        <Button asChild className="mt-6">
          <Link to="/blog">Back to Blog Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      ref={componentRef}
    >
      <div className="bg-white dark:bg-gray-900 font-sans">
        <div className="container mx-auto max-w-4xl px-6 py-12">
          <div className="animate-breadcrumb">
            <Breadcrumbs category={article.category} title={article.title} />
          </div>
          <div className="animate-header">
            <ArticleHeader category={article.category} title={article.title} lastUpdated={article.lastUpdated} />
          </div>
          <div className="animate-author-info">
            <AuthorInfo author={article.author} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <article className="md:col-span-2 animate-body">
              <ArticleBody content={article.content} />
            </article>
            <aside className="md:col-span-1 animate-aside">
              <div className="sticky top-24">
                <motion.img 
                  src={article.featuredImage}
                  alt={article.title}
                  className="rounded-lg shadow-lg w-full"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
              </div>
            </aside>
          </div>
          <div className="animate-author-bio">
            <AuthorBio author={article.author} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

//================================================================================
// 3. Skeleton Loader Component
//================================================================================
const SingleBlogSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 font-sans animate-pulse">
        <div className="container mx-auto max-w-4xl px-6 py-12">
            <Skeleton className="h-5 w-3/4" />
            <header className="mt-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-4 w-48 mt-4" />
            </header>
            <div className="my-8 flex items-center justify-between border-y border-gray-200 dark:border-gray-700 py-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-10 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-10 w-1/3 mt-6 mb-4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
                <aside className="md:col-span-1">
                    <Skeleton className="h-64 w-full rounded-lg" />
                </aside>
            </div>
        </div>
    </div>
);

export default SingleBlogPage;