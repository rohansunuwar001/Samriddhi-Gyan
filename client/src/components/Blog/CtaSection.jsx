import { Button } from "../ui/button";

const CtaSection = () => (
    <div className="bg-indigo-700">
        <div className="container mx-auto px-6 py-16 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Empower your team. Lead the industry.</h2>
            <p className="max-w-3xl mx-auto mb-8">
                Get a subscription to a library of online courses and digital learning tools for your organization with Udemy Business.
            </p>
            <Button variant="secondary" size="lg" className="bg-gray-900 text-white hover:bg-black">
                Request a demo
            </Button>
        </div>
    </div>
);

export default CtaSection;