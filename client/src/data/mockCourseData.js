// --- This mock data mimics a real API response ---
export const mockCourseData = {
    title: '100 Days of Code: The Complete Python Pro Bootcamp',
    subtitle: 'Master Python by building 100 projects in 100 days. Learn data science, automation, build websites, games and apps!',
    rating: 4.7,
    reviewsCount: 384915,
    studentsCount: 1632523,
    creator: {
        name: 'Dr. Angela Yu',
        title: 'Developer and Lead Instructor',
    },
    lastUpdated: '1/2025',
    language: 'English',
    subtitles: ['English', 'Arabic', 'French', 'German', 'Italian', 'Japanese', 'Korean', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Simplified Chinese', 'Spanish', 'Thai', 'Traditional Chinese', 'Turkish', 'Vietnamese'],
    isBestseller: true,
    thumbnail: '/images/course-thumbnail.jpg', // Place an image here
    price: {
        current: 12.99,
        original: 69.99,
        discount: 81,
    },
    learnings: [
        'You will master the Python programming language by building 100 unique projects over 100 days.',
        'You will learn automation, game, app and web development, data science and machine learning all using Python.',
        'You will be able to program in Python professionally.',
        // ... add all other points
        'Create a portfolio of 100 Python projects to apply for developer jobs.',
    ],
    includes: [
        { icon: 'Youtube', text: '52 hours on-demand video' },
        { icon: 'Code', text: '23 coding exercises' },
        { icon: 'FileText', text: '225 articles' },
        { icon: 'Download', text: '164 downloadable resources' },
        { icon: 'Smartphone', text: 'Access on mobile and TV' },
        { icon: 'Award', text: 'Certificate of completion' },
    ],
    sections: [
        {
            title: 'Day 1 - Beginner - Working with Variables in Python to Manage Data',
            lectureCount: 12,
            duration: '1hr 12min',
            lectures: [
                { title: 'What you\'re going to get from this course', duration: '03:27', isPreview: true },
                { title: 'START HERE', duration: '02:53', isPreview: true },
                // ... more lectures
            ],
        },
        {
            title: 'Day 2 - Beginner - Understanding Data Types and How to Manipulate Strings',
            lectureCount: 7,
            duration: '58min',
            lectures: [],
        },
        // ... Add more sections
    ],
    totalLectures: 592,
    totalLength: '56h 22m',
    requirements: [
        'No programming experience needed - I\'ll teach you everything you need to know.',
        'A 64-bit Mac or PC computer with 4GB of memory and access to the internet.',
        'No paid software required - I\'ll teach you how to use PyCharm, Jupyter Notebooks and Google Colab.'
    ],
    descriptionHtml: `
        <p class="mb-4">Welcome to the 100 Days of Code - The Complete Python Pro Bootcamp, <strong>the only course you need</strong> to learn to code with Python. With over 500,000 <strong>5 STAR reviews</strong> and a 4.8 average, my courses are some of the HIGHEST RATED courses in the history of Udemy!</p>
        <p>100 days, 1 hour per day, learn to build 1 project per day, this is how you master Python.</p>
    `,
    instructor: {
        name: 'Dr. Angela Yu',
        title: 'Developer and Lead Instructor',
        image: '/images/instructor-profile.jpg', // Place an image here
        rating: 4.7,
        reviews: 990639,
        students: 3241278,
        courses: 7,
        bioHtml: `
            <p class="mb-4">I'm Angela, I'm a developer with a passion for teaching. I'm the <strong>lead instructor</strong> at the London App Brewery, London's leading <strong>Programming Bootcamp</strong>. I've helped hundreds of thousands of students learn to code and change their lives by becoming a developer.</p>
            <p>My first foray into programming was when I was just 12 years old, wanting to build my own Space Invader game. Since then, I've made <strong>hundreds of websites, apps and games</strong>. But most importantly, I realised that my <strong>greatest passion</strong> is teaching.</p>
        `,
    },
    // For your existing review component
    reviews: [ 
        {
            _id: "1", user: { name: "Md Nurul H.", photoUrl: null },
            rating: 5, comment: "I had a great experience with this course. The content was well-structured, easy to follow, and very informative.", createdAt: "2025-07-08T10:00:00Z"
        },
        {
             _id: "2", user: { name: "Veer", photoUrl: null },
             rating: 4, comment: "This course was a bit hard... but overall a great experience.", createdAt: "2025-07-05T10:00:00Z"
        }
    ],
    ratings: 4.7,
    numOfReviews: 379000,
};