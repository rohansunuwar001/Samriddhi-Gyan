import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Plus, Clock, User, ChevronDown, Reply, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Mock data - replace with your actual data fetching logic
const discussions = [
  {
    id: '1',
    slug: 'react-hooks-best-practices',
    title: 'React Hooks Best Practices?',
    author: 'Alex Johnson',
    authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    course: 'Advanced React',
    category: 'Programming',
    tags: ['react', 'hooks', 'frontend'],
    replies: 12,
    views: 145,
    lastActivity: '2023-11-15T14:30:00Z',
    isAnswered: true,
    isInstructorReply: true
  },
  {
    id: '2',
    slug: 'css-grid-layout-help',
    title: 'Need help with CSS Grid layout',
    author: 'Maria Garcia',
    authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    course: 'CSS Mastery',
    category: 'Web Design',
    tags: ['css', 'layout', 'responsive'],
    replies: 5,
    views: 89,
    lastActivity: '2023-11-14T09:15:00Z',
    isAnswered: false,
    isInstructorReply: false
  },
  {
    id: '3',
    slug: 'python-data-analysis',
    title: 'Python for Data Analysis - Resources?',
    author: 'Sam Wilson',
    authorAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    course: 'Data Science',
    category: 'Programming',
    tags: ['python', 'pandas', 'data-science'],
    replies: 8,
    views: 112,
    lastActivity: '2023-11-13T16:45:00Z',
    isAnswered: true,
    isInstructorReply: false
  },
  {
    id: '4',
    slug: 'javascript-closure-question',
    title: 'Understanding JavaScript Closures',
    author: 'Priya Patel',
    authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    course: 'JavaScript Fundamentals',
    category: 'Programming',
    tags: ['javascript', 'closures', 'functions'],
    replies: 3,
    views: 67,
    lastActivity: '2023-11-12T11:20:00Z',
    isAnswered: false,
    isInstructorReply: false
  },
  {
    id: '5',
    slug: 'career-advice-web-dev',
    title: 'Career Advice for Web Developers',
    author: 'Michael Chen',
    authorAvatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    course: 'Career Development',
    category: 'Career',
    tags: ['career', 'web-development', 'jobs'],
    replies: 15,
    views: 203,
    lastActivity: '2023-11-10T18:10:00Z',
    isAnswered: true,
    isInstructorReply: true
  },
];

const categories = ['All', 'Programming', 'Web Design', 'Career', 'General'];
const courses = ['All', 'Advanced React', 'CSS Mastery', 'Data Science', 'JavaScript Fundamentals', 'Career Development'];
const sortOptions = ['Most Recent', 'Most Replies', 'Unanswered'];

const ForumPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Most Recent');
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Filter and sort discussions
  const filteredDiscussions = discussions
    .filter(discussion => {
      const matchesSearch = discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          discussion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || discussion.category === selectedCategory;
      const matchesCourse = selectedCourse === 'All' || discussion.course === selectedCourse;
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => discussion.tags.includes(tag));
      const matchesUnanswered = selectedSort !== 'Unanswered' || !discussion.isAnswered;
      
      return matchesSearch && matchesCategory && matchesCourse && matchesTags && matchesUnanswered;
    })
    .sort((a, b) => {
      if (selectedSort === 'Most Replies') {
        return b.replies - a.replies;
      } else if (selectedSort === 'Unanswered') {
        return a.isAnswered ? 1 : -1;
      }
      // Default: Most Recent
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

  const allTags = Array.from(new Set(discussions.flatMap(d => d.tags)));

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleNewPostSubmit = (e) => {
    e.preventDefault();
    // Here you would typically call an API to create the new post
    console.log('New post:', { title: newPostTitle, content: newPostContent });
    setNewPostOpen(false);
    setNewPostTitle('');
    setNewPostContent('');
    // Add optimistic update or refetch discussions
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-normal text-gray-800 dark:text-white">Community Forum</h1>
            <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Discussion</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNewPostSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="What's your question?"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Details</Label>
                    <Textarea
                      id="content"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Provide more details about your question..."
                      className="mt-1 min-h-[200px]"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setNewPostOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Post Discussion</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search discussions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredDiscussions.length > 0 ? (
              filteredDiscussions.map(discussion => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <Link to={`/forum/${discussion.id}/${discussion.slug}`} className="block">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {discussion.isAnswered && (
                              <Badge variant="success" className="gap-1">
                                <Check className="h-3 w-3" />
                                Answered
                              </Badge>
                            )}
                            {discussion.isInstructorReply && (
                              <Badge variant="secondary">Instructor Reply</Badge>
                            )}
                            <Badge variant="outline">{discussion.category}</Badge>
                          </div>
                          <h3 className="text-xl font-normal text-gray-800 dark:text-white mb-2">
                            {discussion.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {discussion.tags.map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline"
                                className="text-sm"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center text-base text-gray-500 dark:text-gray-400">
                            <img 
                              src={discussion.authorAvatar} 
                              alt={discussion.author}
                              className="h-6 w-6 rounded-full mr-2"
                            />
                            {discussion.author} • {discussion.course}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400">
                            <MessageSquare className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <div className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(discussion.lastActivity)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
              >
                <MessageSquare className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-light text-gray-800 dark:text-white mb-2">
                  No discussions found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedCourse('All');
                  setSelectedSort('Most Recent');
                  setSelectedTags([]);
                }}>
                  Clear filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;