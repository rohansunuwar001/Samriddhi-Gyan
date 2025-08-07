import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

// --- UI Components & Icons ---
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { allCategories, blogArticles } from '@/data/mockData';
import BlogHeroSection from './BlogHeroSection';
import CategoriesNavBar from './CategoryNavbar';
import ArticleCard from './ArticleCard';
import ArticleSection from './ArticleSection';
import CtaSection from './CtaSection';

// --- Shared Data & Page Components ---


// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const componentRef = useRef(null);

  // GSAP Scroll-Triggered Animation Setup
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Use a class to target sections for a fade-in-up animation on scroll
      gsap.utils.toArray('.animate-on-scroll').forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, componentRef);
    return () => ctx.revert();
  }, []);

  // Filtering Logic
  const filteredArticles = useMemo(() => {
    return blogArticles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const popularArticles = filteredArticles.filter(a => a.popular);
  const sectionsToDisplay = selectedCategory === 'All' ? allCategories : [selectedCategory];

  return (
    <div ref={componentRef} className="bg-gray-100 dark:bg-gray-900">
      {/* These components don't have internal animations but will be animated as a whole by the parent */}
      <div className="animate-on-scroll"><BlogHeroSection /></div>
      
      <CategoriesNavBar
        categories={allCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      <main className="py-12">
        <div className="container mx-auto px-6 mb-12 animate-on-scroll">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search articles by title..."
              className="pl-12 pr-4 py-3 text-base h-14 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* AnimatePresence will handle the smooth transition when categories change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory} // Key change triggers the animation
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {selectedCategory === 'All' && !searchQuery && (
              <section className="container mx-auto px-6 animate-on-scroll">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Popular Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                  {/* AnimatePresence here will handle individual card animations on filter */}
                  <AnimatePresence>
                    {popularArticles.map(article => (
                      <ArticleCard key={article.id} article={article} size="large" />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {sectionsToDisplay.map(category => (
              <div key={category} className="animate-on-scroll">
                <ArticleSection
                  title={`${category} Articles`}
                  articles={filteredArticles.filter(a => a.category === category)}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* "No results" message with animation */}
        <AnimatePresence>
          {filteredArticles.length === 0 && searchQuery && (
            <motion.div
              className="text-center py-16 text-gray-500 container mx-auto px-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-2xl font-semibold">No articles found for `{searchQuery}`</h3>
              <p className="mt-2">Try searching for something else or clearing your search.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="animate-on-scroll">
          <CtaSection />
        </div>
      </main>
    </div>
  );
};

export default BlogPage;