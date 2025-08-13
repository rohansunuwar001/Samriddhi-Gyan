import { Course } from "../models/course.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";


/**
 * @desc    Get comprehensive search results based on a query
 * @route   GET /api/search?q=your_query
 * @access  Public
 */
export const getSearchResults = async (req, res) => {
  try {
    const { q } = req.query;

    // Return empty results if the query is missing or empty
    if (!q || q.trim() === '') {
      return res.status(200).json({ suggestions: [], courses: [] });
    }

    // Sanitize the query to prevent Regex Injection attacks
    const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(sanitizedQuery, 'i'); // 'i' for case-insensitivity

    // Run both database lookups in parallel for maximum efficiency
    const [courses, suggestionDocs] = await Promise.all([
      // --- Query 1: Find Courses using the Aggregation Pipeline ---
      Course.aggregate([
        // Stage 1: Initial match to filter for only published courses.
        // This is a crucial performance optimization.
        {
          $match: { isPublished: true }
        },
        // Stage 2: Join with the 'users' collection to get creator's name
        {
          $lookup: {
            from: 'users', // The name of the users collection
            localField: 'creator',
            foreignField: '_id',
            as: 'creatorInfo'
          }
        },
        // Stage 3: Deconstruct the creatorInfo array to an object
        {
          $unwind: {
            path: '$creatorInfo',
            preserveNullAndEmptyArrays: true // Keep courses even if creator is not found
          }
        },
        // Stage 4: Match against all relevant fields
        {
          $match: {
            $or: [
              { courseTitle: searchRegex },
              { subTitle: searchRegex },
              { category: searchRegex },
              { 'creatorInfo.name': searchRegex } // Search by the creator's name
            ]
          }
        },
        // Stage 5: Limit the number of results
        {
          $limit: 5
        },
        // Stage 6: Project only the fields needed by the frontend for a smaller payload
        {
          $project: {
            _id: 1, // The course ID is needed for the link
            title: '$title', // Rename for consistency
            thumbnail: '$Thumbnail',
            creatorName: '$creatorInfo.name' // Send only the creator's name
          }
        }
      ]),

      // --- Query 2: Find Search Suggestions ---
      SearchSuggestion.find({ term: searchRegex }).limit(8).lean()
    ]);

    // Format suggestions into a simple array of strings
    const suggestions = suggestionDocs.map(s => s.term);

    // Send the final, combined results
    res.status(200).json({ suggestions, courses });

  } catch (error) {
    console.error('Search controller error:', error);
    res.status(500).json({ message: 'Server error during search.' });
  }
};