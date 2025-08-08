import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, PlayCircle } from 'lucide-react';
import PropTypes from 'prop-types';
const PurchaseCard = ({ course }) => {
    return (
        <Card className="shadow-lg lg:sticky lg:top-6">
            <div className="relative">
                {/* For a standard React app, use: */}
                <img src={course.thumbnail} alt={course.title} className="w-full h-auto object-cover" />
                {/* For Next.js:
                <Image src={course.thumbnail} alt={course.title} width={400} height={225} layout="responsive" /> */}
                 <div style={{ backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: '56.25%' }}></div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white" />
                    <p className="text-white mt-2 font-semibold">Preview this course</p>
                </div>
            </div>
            <CardContent className="p-4 space-y-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">₹{course.price.current}</span>
                    <span className="text-gray-500 line-through">₹{course.price.original}</span>
                    <span className="font-semibold">{course.price.discount}% off</span>
                </div>

                <div className="text-red-600 flex items-center gap-2">
                    <Clock className="h-4 w-4"/>
                    <span className="font-semibold">10 hours</span> left at this price!
                </div>
                
                <div className="flex flex-col gap-2">
                    <Button className="w-full bg-gray-600 hover:bg-gray-700 h-12 text-lg">Add to cart</Button>
                    <Button variant="outline" className="w-full h-12 text-lg">Buy now</Button>
                </div>

                <p className="text-center text-xs text-gray-500">30-Day Money-Back Guarantee</p>
            </CardContent>
        </Card>
    );
};


PurchaseCard.propTypes = {
    course: PropTypes.shape({
        thumbnail: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        price: PropTypes.shape({
            current: PropTypes.number.isRequired,
            original: PropTypes.number.isRequired,
            discount: PropTypes.number.isRequired,
        }).isRequired,
    }).isRequired,
};


export default PurchaseCard;