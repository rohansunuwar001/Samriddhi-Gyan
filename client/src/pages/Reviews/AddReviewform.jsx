import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAddReviewMutation } from '@/features/api/purchaseApi';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import PropTypes from 'prop-types';

// --- (CORRECTED) IMPORT The useToast hook ---
import { useToast } from '@/hooks/use-toast'; // Make sure this path is correct


const StarRatingInput = ({ rating, setRating, hoverRating, setHoverRating }) => {
    return (
        <div className="flex items-center gap-1 py-2">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <FaStar
                        key={starValue}
                        size={24}
                        className="cursor-pointer transition-colors"
                        color={starValue <= (hoverRating || rating) ? '#ffc107' : '#e4e5e9'}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                    />
                );
            })}
        </div>
    );
};

const AddReviewForm = ({ courseId }) => {
    // This line will now work correctly.
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const [addReview, { isLoading }] = useAddReviewMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast({ variant: "destructive", title: "Rating Required", description: "Please select a star rating before submitting." });
            return;
        }
        if (comment.trim() === '') {
            toast({ variant: "destructive", title: "Comment Required", description: "Please write a comment to go with your review." });
            return;
        }

        try {
            await addReview({ courseId, reviewData: { rating, comment } }).unwrap();
            toast({ title: "Success!", description: "Thank you! Your review has been submitted." });
            setRating(0);
            setComment('');
        } catch (err) {
            const errorMessage = err.data?.message || "Failed to submit review. You may have already reviewed this course.";
            toast({ variant: "destructive", title: "Submission Failed", description: errorMessage });
        }
    };

    return (
        <div className="my-8">
            <Card>
                <CardHeader>
                    <CardTitle>Leave a Review</CardTitle>
                    <CardDescription>Share your experience with other students</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Your Rating</label>
                            <StarRatingInput
                                rating={rating}
                                setRating={setRating}
                                hoverRating={hoverRating}
                                setHoverRating={setHoverRating}
                            />
                        </div>
                        <div>
                            <label htmlFor="comment" className="font-semibold text-gray-700 dark:text-gray-300">
                                Your Comment
                            </label>
                            <Textarea
                                id="comment"
                                placeholder="What did you like or dislike about this course? What did you learn?"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Review
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

StarRatingInput.propTypes = {
    rating: PropTypes.number.isRequired,
    setRating: PropTypes.func.isRequired,
    hoverRating: PropTypes.number.isRequired,
    setHoverRating: PropTypes.func.isRequired,
};
AddReviewForm.propTypes = {
    courseId: PropTypes.string.isRequired,
};


export default AddReviewForm;