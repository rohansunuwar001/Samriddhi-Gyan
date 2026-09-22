/* eslint-disable react/prop-types */
import { useRef, useLayoutEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetCombinedSearchByTopicQuery } from "@/features/api/combinedSearchApi";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Star } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CourseResultCard = ({ course }) => (
  <Link to={`/course-detail/${course.slug || course._id}`}>
    <Card className="topic-course-card overflow-hidden hover:shadow-md transition-shadow h-full">
      <img
        src={course.thumbnail}
        alt={course.title}
        className="w-full aspect-video object-cover"
      />
      <CardContent className="p-4 space-y-1">
        <h3 className="font-medium line-clamp-2">{course.title}</h3>
        {course.category && (
          <p className="text-base text-muted-foreground">{course.category}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {typeof course.ratings === "number" && (
            <span className="flex items-center gap-1 text-base text-yellow-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              {course.ratings.toFixed(1)}
            </span>
          )}
          {course.price?.current !== undefined && (
            <span className="font-semibold">Rs{course.price.current}</span>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
);

const ArticleResultCard = ({ article }) => (
  <Link to={`/blog/${article.slug}`}>
    <Card className="topic-article-card overflow-hidden hover:shadow-md transition-shadow h-full">
      <img
        src={article.featuredImage}
        alt={article.title}
        className="w-full aspect-video object-cover"
      />
      <CardContent className="p-4 space-y-1">
        <h3 className="font-medium line-clamp-2">{article.title}</h3>
        <p className="text-base text-muted-foreground">
          {article.author?.name || "Unknown author"}
        </p>
      </CardContent>
    </Card>
  </Link>
);

const ResultsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

const TopicSearchResultsPage = () => {
  const { topic } = useParams();
  const { data, isLoading, isError, error } = useGetCombinedSearchByTopicQuery(topic);
  const pageRef = useRef(null);

  const courses = data?.courses || [];
  const articles = data?.articles || [];
  const hasResults = courses.length > 0 || articles.length > 0;

  useLayoutEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      // Header slides down
      gsap.from(".topic-page-header", {
        opacity: 0,
        y: -30,
        duration: 0.7,
        ease: "power3.out",
      });

      // Section titles fade in
      gsap.from(".topic-section-title", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".topic-section-title",
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      // Course cards stagger in
      gsap.from(".topic-course-card", {
        opacity: 0,
        y: 35,
        scale: 0.94,
        duration: 0.55,
        stagger: 0.08,
        ease: "back.out(1.3)",
        scrollTrigger: {
          trigger: ".topic-courses-grid",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // Article cards stagger in
      gsap.from(".topic-article-card", {
        opacity: 0,
        y: 35,
        scale: 0.94,
        duration: 0.55,
        stagger: 0.08,
        ease: "back.out(1.3)",
        scrollTrigger: {
          trigger: ".topic-articles-grid",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, [isLoading, courses.length, articles.length]);

  return (
    <div ref={pageRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <header className="topic-page-header">
        <p className="text-base text-muted-foreground">Topic</p>
        <h1 className="text-4xl font-semibold tracking-tight">{topic}</h1>
      </header>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.data?.message || "Failed to load results for this topic."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <ResultsSkeleton />
      ) : !hasResults ? (
        <p className="text-muted-foreground py-10 text-center">
          Nothing found for &quot;{topic}&quot; yet.
        </p>
      ) : (
        <>
          {courses.length > 0 && (
            <section className="space-y-4">
              <h2 className="topic-section-title text-2xl font-semibold">Courses</h2>
              <div className="topic-courses-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseResultCard key={course._id} course={course} />
                ))}
              </div>
            </section>
          )}

          {articles.length > 0 && (
            <section className="space-y-4">
              <h2 className="topic-section-title text-2xl font-semibold">Articles</h2>
              <div className="topic-articles-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {articles.map((article) => (
                  <ArticleResultCard key={article._id} article={article} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TopicSearchResultsPage;
