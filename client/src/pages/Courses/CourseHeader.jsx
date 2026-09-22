import {
    BadgeCheck,
    CalendarDays,
    ChevronRight,
    Globe2,
    Star,
    UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { useGetAllCategoriesQuery } from '@/features/api/categoryApi';

const normalizeLabel = (value) => value?.trim().toLowerCase();

const DEFAULT_PARENT_MAP = {
    "frontend development": "Development",
    "backend development": "Development",
    "web development": "Development",
    "mobile development": "Development",
    "programming languages": "Development",
    "game development": "Development",
    "database design & development": "Development",
    "software testing": "Development",
    "software engineering": "Development",
    "software development tools": "Development",
    "no-code development": "Development",
    "data science": "Development",
    "entrepreneurship": "Business",
    "communication": "Business",
    "management": "Business",
    "sales": "Business",
    "business strategy": "Business",
    "operations": "Business",
    "project management": "Business",
    "accounting & bookkeeping": "Finance & Accounting",
    "cryptocurrency & blockchain": "Finance & Accounting",
    "finance": "Finance & Accounting",
    "it certifications": "IT & Software",
    "network & security": "IT & Software",
    "hardware": "IT & Software",
    "microsoft": "Office Productivity",
    "leadership": "Personal Development",
    "career development": "Personal Development",
    "web design": "Design",
    "graphic design & illustration": "Design",
    "digital marketing": "Marketing",
    "fitness": "Health & Fitness",
    "instruments": "Music",
};

const getBreadcrumbItems = (course, categoryTree = []) => {
    let items = [];

    if (Array.isArray(course.categoryHierarchy) && course.categoryHierarchy.length >= 2) {
        items = [...course.categoryHierarchy];
    } else {
        if (course.category) items.push(course.category);
        if (Array.isArray(course.topics)) {
            course.topics.forEach((t) => {
                if (t && !items.includes(t)) items.push(t);
            });
        }
    }

    // If items don't start with top-level parent (e.g. "Frontend Development > React Js"),
    // find the top-level parent and prepend it so we have Parent > Child > Subchild
    const firstItem = items[0];
    if (firstItem) {
        const firstNorm = firstItem.trim().toLowerCase();
        let parentFound = null;

        for (const p of categoryTree) {
            if (p.name?.trim().toLowerCase() === firstNorm) {
                parentFound = null;
                break;
            }
            const hasChild = p.children?.some(
                (c) => c.name?.trim().toLowerCase() === firstNorm ||
                       c.children?.some((sc) => sc.name?.trim().toLowerCase() === firstNorm)
            );
            if (hasChild) {
                parentFound = p.name;
                break;
            }
        }

        if (!parentFound && DEFAULT_PARENT_MAP[firstNorm]) {
            parentFound = DEFAULT_PARENT_MAP[firstNorm];
        }

        if (parentFound && !items.map(normalizeLabel).includes(normalizeLabel(parentFound))) {
            items.unshift(parentFound);
        }
    }

    // Append primary topic if missing
    if (items.length === 2 && course.topics && course.topics.length > 0) {
        const topic = course.topics[0];
        if (!items.map(normalizeLabel).includes(normalizeLabel(topic))) {
            items.push(topic);
        }
    }

    return items
        .map((item) => item?.trim())
        .filter(Boolean)
        .filter((item, index, list) => {
            const normalized = normalizeLabel(item);
            return normalized && list.findIndex((entry) => normalizeLabel(entry) === normalized) === index;
        });
};

const CourseHeader = ({ course, purchasePanel }) => {
    const { data: catData } = useGetAllCategoriesQuery();
    const categoryTree = catData?.categoryTree || [];

    const rating = typeof course.ratings === 'number' ? course.ratings : 4.6;
    const reviewsCount = typeof course.numOfReviews === 'number' ? course.numOfReviews : 0;
    const learnersCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0;
    const breadcrumbItems = getBreadcrumbItems(course, categoryTree);
    const creatorName = course.creator?.name || 'Instructor';
    const lastUpdated = course.updatedAt
        ? new Date(course.updatedAt).toLocaleDateString(undefined, { month: 'numeric', year: 'numeric' })
        : '7/2026';

    const renderStars = (size = 'h-3.5 w-3.5') => (
        <div className="flex items-center gap-0.5" aria-label={rating.toFixed(1) + ' out of 5 stars'}>
            {Array.from({ length: 5 }).map((_, index) => {
                const filled = index + 1 <= Math.round(rating);
                return (
                    <Star
                        key={index}
                        className={[
                            size,
                            filled ? 'fill-[#e59819] text-[#e59819]' : 'text-[#e59819]',
                        ].join(' ')}
                    />
                );
            })}
        </div>
    );

    return (
        <header className="relative bg-white font-sans">
            {/* Dark Udemy Hero Section */}
            <section className="bg-[#1c1d1f] text-white">
                <div className="mx-auto grid max-w-[1340px] gap-8 px-4 sm:px-6 md:px-8 pt-8 pb-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px]">
                    <div className="pb-4 lg:pb-12">
                        {/* Breadcrumb Navigation */}
                        {breadcrumbItems.length > 0 && (
                            <nav className="mb-6 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[#c0c4fc]">
                                {breadcrumbItems.map((item, index) => {
                                    const isLeaf = index === breadcrumbItems.length - 1;
                                    return (
                                        <span key={item} className="flex items-center gap-2">
                                            {isLeaf ? (
                                                <Link 
                                                    to={`/topic/${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                                    className="hover:text-[#d1d5fc] transition-colors"
                                                >
                                                    {item}
                                                </Link>
                                            ) : (
                                                <span className="text-[#c0c4fc]/80 font-normal">
                                                    {item}
                                                </span>
                                            )}
                                            {index < breadcrumbItems.length - 1 && (
                                                <ChevronRight className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
                                            )}
                                        </span>
                                    );
                                })}
                            </nav>
                        )}

                        <div className="max-w-[760px]">
                            {/* Course Title */}
                            <h1 className="text-[26px] sm:text-[30px] md:text-[32px] font-semibold leading-[1.25] tracking-tight text-white">
                                {course.title ? (course.title.trim().endsWith('|') ? course.title : `${course.title} |`) : ''}
                            </h1>

                            {/* Subtitle / Headline from backend */}
                            {(course.subtitle || course.subTitle) && (
                                <p className="mt-2 text-[26px] sm:text-[30px] md:text-[32px] font-light leading-[1.25] tracking-tight text-white/95">
                                    {course.subtitle || course.subTitle}
                                </p>
                            )}

                            {/* Instructor Credit */}
                            <p className="mt-4 text-[14px] font-light text-white">
                                Created by{' '}
                                {course.creator?._id ? (
                                    <Link
                                        to={`/${course.creator.role === 'admin' ? 'admin' : 'instructor'}/${(course.creator.name || "instructor").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${course.creator._id}`}
                                        className="font-light text-[#c0c4fc] underline underline-offset-2 hover:text-[#d1d5fc]"
                                    >
                                        {creatorName}
                                    </Link>
                                ) : (
                                    <span className="text-[#c0c4fc] underline underline-offset-2 font-light">
                                        {creatorName}
                                    </span>
                                )}
                            </p>

                            {/* Metadata Row */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-white/90">
                                {lastUpdated && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="h-4 w-4 text-white/70" aria-hidden="true" />
                                        Last updated {lastUpdated}
                                    </span>
                                )}

                                {course.language && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Globe2 className="h-4 w-4 text-white/70" aria-hidden="true" />
                                        {course.language}
                                    </span>
                                )}

                                <span className="inline-flex items-center gap-1.5">
                                    <BadgeCheck className="h-4 w-4 text-white/70" aria-hidden="true" />
                                    English [Auto]
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block" aria-hidden="true" />
                </div>
            </section>

            {/* Premium / Rating Stat Banner Bar */}
            <div className="relative z-20 mx-auto -mt-6 grid max-w-[1340px] gap-8 px-4 sm:px-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="grid overflow-hidden border border-[#d1d7dc] bg-white shadow-sm md:grid-cols-[130px_1fr_160px_150px]">
                    <div className="flex min-h-[72px] flex-col items-center justify-center gap-1 bg-[#5624d0] px-4 py-3 text-center text-white">
                        <BadgeCheck className="h-6 w-6" aria-hidden="true" />
                        <span className="text-[14px] font-semibold tracking-tight">Premium</span>
                    </div>

                    <div className="flex min-h-[72px] items-center px-5 py-3 text-[14px] leading-relaxed text-[#2d2f31]">
                        <p>
                            Access 28,000+ top-rated courses with Samriddhi Gyan{' '}
                            <Link to="/subscribe" className="text-[#5624d0] font-semibold underline underline-offset-2">
                                Personal Plan.
                            </Link>
                        </p>
                    </div>

                    <div className="flex min-h-[72px] flex-col items-center justify-center border-t border-[#d1d7dc] px-4 py-3 text-center md:border-l md:border-t-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[18px] font-semibold text-[#b4690e]">{rating.toFixed(1)}</span>
                            {renderStars('h-3.5 w-3.5')}
                        </div>
                        <span className="text-[12px] text-[#5624d0] underline underline-offset-2 cursor-pointer mt-0.5">
                            {reviewsCount > 0 ? reviewsCount.toLocaleString() : '26'} ratings
                        </span>
                    </div>

                    <div className="flex min-h-[72px] flex-col items-center justify-center border-t border-[#d1d7dc] px-4 py-3 text-center md:border-l md:border-t-0">
                        <span className="text-[16px] font-semibold text-[#2d2f31]">
                            {learnersCount > 0 ? learnersCount.toLocaleString() : '401'}
                        </span>
                        <span className="text-[12px] text-[#6a6f73]">learners</span>
                    </div>
                </div>

                {purchasePanel && (
                    <div className="lg:hidden mt-4">
                        {purchasePanel}
                    </div>
                )}
            </div>
        </header>
    );
};

CourseHeader.propTypes = {
    course: PropTypes.shape({
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string,
        category: PropTypes.string,
        topics: PropTypes.arrayOf(PropTypes.string),
        categoryHierarchy: PropTypes.arrayOf(PropTypes.string),
        isBestseller: PropTypes.bool,
        ratings: PropTypes.number,
        numOfReviews: PropTypes.number,
        enrolledStudents: PropTypes.array,
        creator: PropTypes.shape({
            _id: PropTypes.string,
            name: PropTypes.string,
            headline: PropTypes.string,
            role: PropTypes.string,
        }),
        updatedAt: PropTypes.string,
        language: PropTypes.string,
    }).isRequired,
    purchasePanel: PropTypes.node,
};

export default CourseHeader;
