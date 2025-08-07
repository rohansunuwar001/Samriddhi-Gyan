import PropTypes from "prop-types";
import { GraduationCap, MonitorPlay, BookOpenCheck, Clock, Smartphone, Award, BarChart2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const LmsShowcase = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-white">
            Elevate Your Learning Experience
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 mx-auto">
            Everything you need to succeed in your learning journey
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="features" className="mb-12">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="features">Platform Features</TabsTrigger>
            <TabsTrigger value="benefits">Student Benefits</TabsTrigger>
            <TabsTrigger value="testimonials">Success Stories</TabsTrigger>
          </TabsList>

          {/* Platform Features */}
          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              <FeatureCard 
                icon={<MonitorPlay className="h-8 w-8" />}
                title="Interactive Video Lessons"
                description="Engaging video content with playback controls and speed adjustment"
              />
              <FeatureCard 
                icon={<BookOpenCheck className="h-8 w-8" />}
                title="Comprehensive Curriculum"
                description="Structured learning paths with progressive difficulty levels"
              />
              <FeatureCard 
                icon={<Clock className="h-8 w-8" />}
                title="Learn At Your Pace"
                description="Lifetime access to course materials with no expiration"
              />
              <FeatureCard 
                icon={<Smartphone className="h-8 w-8" />}
                title="Mobile Friendly"
                description="Access courses anytime, anywhere on any device"
              />
              <FeatureCard 
                icon={<BarChart2 className="h-8 w-8" />}
                title="Progress Tracking"
                description="Visual dashboards to monitor your learning journey"
              />
              <FeatureCard 
                icon={<Award className="h-8 w-8" />}
                title="Certification"
                description="Earn verifiable certificates upon course completion"
              />
            </div>
          </TabsContent>

          {/* Student Benefits */}
          <TabsContent value="benefits">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <GraduationCap className="text-blue-600 dark:text-blue-400" />
                  What You`ll Get
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>High-quality video lectures from industry experts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Practical assignments with personalized feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Interactive quizzes to test your knowledge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Downloadable resources and cheat sheets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Verifiable certificates of completion</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Users className="text-blue-600 dark:text-blue-400" />
                  Community & Support
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Access to exclusive student community forums</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Q&A sessions with instructors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Priority email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Weekly office hours for live help</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Study groups and peer learning</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Testimonials */}
          <TabsContent value="testimonials">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              <TestimonialCard 
                name="Sarah Johnson"
                role="Web Developer"
                avatar="https://randomuser.me/api/portraits/women/44.jpg"
                quote="This platform transformed my career. The courses are well-structured and the projects helped me build a strong portfolio."
                stats="Completed 12 courses | 5 certifications"
              />
              <TestimonialCard 
                name="Michael Chen"
                role="Data Scientist"
                avatar="https://randomuser.me/api/portraits/men/32.jpg"
                quote="The mobile app makes it so easy to learn during my commute. I've doubled my learning progress since I started using it."
                stats="150 hours logged | 8 courses completed"
              />
              <TestimonialCard 
                name="Priya Patel"
                role="UX Designer"
                avatar="https://randomuser.me/api/portraits/women/68.jpg"
                quote="The certifications helped me land my dream job. The interviewers were impressed with the practical skills I gained."
                stats="3 job offers | 100% course completion rate"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats Section */}
        <div className="mt-16 bg-blue-600 dark:bg-blue-800 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold text-center mb-8">Our Learning Community in Numbers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <StatItem value="50,000+" label="Active Learners" />
            <StatItem value="500+" label="Expert Instructors" />
            <StatItem value="10,000+" label="Hours of Content" />
            <StatItem value="95%" label="Completion Rate" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to start learning?</h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of students advancing their careers with our courses
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/course/search" className="text-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Browse Courses  
              </Button>
            </Link>
            <Link to="/how-it-works" className="text-center">
            <Button variant="outline" size="lg">How It Works</Button>
            </Link>
            <Link to="/contact" className="text-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Contact Us
              </Button> 
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// Reusable Components
const FeatureCard = ({ icon, title, description }) => (
  <Card className="hover:shadow-lg transition-shadow h-full">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </CardContent>
  </Card>
);

FeatureCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};


const TestimonialCard = ({ name, role, avatar, quote, stats }) => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <Avatar>
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
        </div>
      </div>
      <p className="italic mb-4">`{quote}`</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{stats}</p>
    </CardContent>
  </Card>
);

TestimonialCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string,
  avatar: PropTypes.string,
  quote: PropTypes.string,
  stats: PropTypes.string,
};

const StatItem = ({ value, label }) => (
  <div>
    <p className="text-3xl font-bold mb-2">{value}</p>
    <p className="text-blue-100">{label}</p>
  </div>
);
StatItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default LmsShowcase;