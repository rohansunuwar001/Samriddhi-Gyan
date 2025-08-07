const BlogHeroSection = () => (
    <div className="bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6 py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="lg:w-1/2 text-center lg:text-left">
                    <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                        Where possibilities begin
                    </h1>
                    <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0">
                        We`re a leading marketplace platform for learning and teaching online. Explore some of our most popular content and learn something new.
                    </p>
                </div>
                <div className="lg:w-1/2 flex items-center justify-center">
                    <img
                        src="/reading-girl-2.png" // Replace with your illustration path
                        alt="Person learning at a desk"
                        className="w-full max-w-md"
                    />
                </div>
            </div>
        </div>
    </div>
);

export default BlogHeroSection;