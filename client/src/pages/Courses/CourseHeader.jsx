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

const normalizeLabel = (value) => value?.trim().toLowerCase();

const getBreadcrumbItems = (course) => {
    const hierarchy = Array.isArray(course.categoryHierarchy) ? course.categoryHierarchy : [];
    const fallbackItems = [course.category, ...(course.topics || [])];
    const items = hierarchy.length > 0 ? hierarchy : fallbackItems;

    return items
        .map((item) => item?.trim())
        .filter(Boolean)
        .filter((item, index, list) => {
            const normalized = normalizeLabel(item);
            return normalized && list.findIndex((entry) => normalizeLabel(entry) === normalized) === index;
        });
};

const CourseHeader = ({ course, purchasePanel }) => {
    const rating = typeof course.ratings === 'number' ? course.ratings : 0;
    const reviewsCount = typeof course.numOfReviews === 'number' ? course.numOfReviews : 0;
    const learnersCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0;
    const breadcrumbItems = getBreadcrumbItems(course);
    const creatorName = course.creator?.name || 'Unknown';
    const creatorHeadline = course.creator?.headline;
    const creatorText = creatorHeadline ? creatorName + ', ' + creatorHeadline : creatorName;
    const lastUpdated = course.updatedAt
        ? new Date(course.updatedAt).toLocaleDateString(undefined, { month: '2-digit', year: 'numeric' })
        : null;

    const renderStars = (size = 'h-4 w-4') => (
        <div className="flex items-center gap-0.5" aria-label={rating.toFixed(1) + ' out of 5 stars'}>
            {Array.from({ length: 5 }).map((_, index) => {
                const filled = index + 1 <= Math.round(rating);
                return (
                    <Star
                        key={index}
                        className={[
                            size,
                            filled ? 'fill-[#c4710d] text-[#c4710d]' : 'text-[#c4710d]',
                        ].join(' ')}
                    />
                );
            })}
        </div>
    );

    return (
        <header className="relative bg-white">
            <section className="bg-[#17161f] text-white">
                <div className="mx-auto grid max-w-[1500px] gap-12 px-6 pb-0 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-10 xl:px-16">
                    <div className="pb-20 lg:pb-[7.25rem]">
                        {breadcrumbItems.length > 0 && (
                            <nav className="mb-10 flex flex-wrap items-center gap-2 text-sm font-bold text-[#a78bfa] sm:text-base">
                                {breadcrumbItems.map((item, index) => (
                                    <span key={item} className="flex items-center gap-2">
                                        <span className="hover:text-[#c4b5fd]">{item}</span>
                                        {index < breadcrumbItems.length - 1 && (
                                            <ChevronRight className="h-4 w-4 text-white/75" aria-hidden="true" />
                                        )}
                                    </span>
                                ))}
                            </nav>
                        )}

                        <div className="max-w-[940px]">
                            <h1 className="max-w-[880px] text-[2.55rem] font-extrabold leading-[1.08] tracking-normal text-white sm:text-5xl">
                                {course.title}
                            </h1>

                            {course.subtitle && (
                                <p className="mt-7 max-w-[1010px] text-[1.6rem] leading-snug text-white/95">
                                    {course.subtitle}
                                </p>
                            )}

                            {course.isBestseller && (
                                <div className="mt-8">
                                    <span className="inline-flex rounded px-3 py-1 text-sm font-extrabold text-[#0f4b53] bg-[#b8f2ff]">
                                        Bestseller
                                    </span>
                                </div>
                            )}

                            <p className="mt-6 text-lg font-normal text-white">
                                Created by{' '}
                                {course.creator?._id ? (
                                    <Link
                                        to={`/${course.creator.role === 'admin' ? 'admin' : 'instructor'}/${(course.creator.name || "instructor").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${course.creator._id}`}
                                        className="font-normal text-[#a78bfa] underline underline-offset-2 hover:text-[#c4b5fd]"
                                    >
                                        {creatorText}
                                    </Link>
                                ) : (
                                    <span className="text-[#a78bfa] underline underline-offset-2 font-normal">
                                        {creatorText}
                                    </span>
                                )}
                            </p>

                            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-base text-white">
                                {lastUpdated && (
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-white/80" aria-hidden="true" />
                                        Last updated {lastUpdated}
                                    </span>
                                )}

                                {course.language && (
                                    <span className="inline-flex items-center gap-2">
                                        <Globe2 className="h-5 w-5 text-white/80" aria-hidden="true" />
                                        {course.language}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block" aria-hidden="true" />
                </div>
            </section>

            <div className="relative z-20 mx-auto -mt-14 grid max-w-[1500px] gap-12 px-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-10 xl:px-16">
                <div className="grid overflow-hidden rounded-lg border border-[#d1d7dc] bg-white shadow-sm md:grid-cols-[150px_1fr_210px_230px]">
                    <div className="flex min-h-28 flex-col items-center justify-center gap-3 bg-[#5624d0] px-5 py-5 text-center text-white">
                        <BadgeCheck className="h-8 w-8" aria-hidden="true" />
                        <span className="text-2xl font-extrabold">Premium</span>
                    </div>

                    <div className="flex min-h-28 items-center px-6 py-5 text-lg leading-relaxed text-[#1f2937]">
                        <p>
                            Access top-rated courses with Samriddhi Gyan{' '}
                            <Link to="/courses" className="text-[#5624d0] underline underline-offset-2">
                                Personal Plan.
                            </Link>
                        </p>
                    </div>

                    <div className="flex min-h-28 flex-col items-center justify-center border-t border-[#d1d7dc] px-5 py-5 text-center md:border-l md:border-t-0">
                        <span className="text-4xl font-extrabold leading-none text-[#1f2937]">{rating.toFixed(1)}</span>
                        <div className="mt-2">{renderStars('h-4 w-4')}</div>
                        <span className="mt-2 text-base text-[#6b7280] underline underline-offset-2">
                            {reviewsCount.toLocaleString()} ratings
                        </span>
                    </div>

                    <div className="flex min-h-28 flex-col items-center justify-center border-t border-[#d1d7dc] px-5 py-5 text-center md:border-l md:border-t-0">
                        <UsersRound className="h-8 w-8 text-[#1f2937]" aria-hidden="true" />
                        <span className="mt-2 text-xl font-extrabold text-[#1f2937]">
                            {learnersCount.toLocaleString()}
                        </span>
                        <span className="mt-1 text-lg text-[#6b7280]">learners</span>
                    </div>
                </div>

                {purchasePanel && (
                    <div className="lg:hidden">
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
        }),
        updatedAt: PropTypes.string,
        language: PropTypes.string,
    }).isRequired,
    purchasePanel: PropTypes.node,
};

export default CourseHeader;
