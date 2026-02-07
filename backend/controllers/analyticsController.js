// backend/controllers/analyticsController.js
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments();
    const processedResumes = await Resume.countDocuments({ status: 'completed' });
    const activeJobs = await Job.countDocuments({ status: 'active' });
    
    // Score distribution
    const scoreDistribution = await Resume.aggregate([
      { $match: { status: 'completed', 'matchScore.overallScore': { $exists: true } } },
      {
        $bucket: {
          groupBy: '$matchScore.overallScore',
          boundaries: [0, 25, 50, 75, 100],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Top skills
    const skillsAgg = await Resume.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$analysis.skills.keywords' },
      { $group: { _id: '$analysis.skills.keywords', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Experience level distribution
    const experienceDistribution = await Resume.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$analysis.experience.experienceLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity
    const recentResumes = await Resume.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('originalName analysis.contact.name matchScore.overallScore createdAt');

    // Recommendation distribution
    const recommendationDistribution = await Resume.aggregate([
      { $match: { status: 'completed', 'matchScore.recommendation.status': { $exists: true } } },
      { $group: { _id: '$matchScore.recommendation.status', count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalResumes,
        processedResumes,
        activeJobs,
        averageScore: await getAverageScore()
      },
      scoreDistribution,
      topSkills: skillsAgg,
      experienceDistribution,
      recommendationDistribution,
      recentResumes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function getAverageScore() {
  const result = await Resume.aggregate([
    { $match: { status: 'completed', 'matchScore.overallScore': { $exists: true } } },
    { $group: { _id: null, avgScore: { $avg: '$matchScore.overallScore' } } }
  ]);
  return result[0]?.avgScore?.toFixed(1) || 0;
}

export const getSkillsAnalytics = async (req, res) => {
  try {
    const { jobId } = req.query;
    const match = { status: 'completed' };
    if (jobId) match.jobId = jobId;

    const skillsByCategory = await Resume.aggregate([
      { $match: match },
      {
        $project: {
          programming: { $size: { $ifNull: ['$analysis.skills.categorized.programming', []] } },
          frontend: { $size: { $ifNull: ['$analysis.skills.categorized.frontend', []] } },
          backend: { $size: { $ifNull: ['$analysis.skills.categorized.backend', []] } },
          database: { $size: { $ifNull: ['$analysis.skills.categorized.database', []] } },
          cloud: { $size: { $ifNull: ['$analysis.skills.categorized.cloud', []] } },
          ml_ai: { $size: { $ifNull: ['$analysis.skills.categorized.ml_ai', []] } },
          soft_skills: { $size: { $ifNull: ['$analysis.skills.categorized.soft_skills', []] } }
        }
      },
      {
        $group: {
          _id: null,
          programming: { $avg: '$programming' },
          frontend: { $avg: '$frontend' },
          backend: { $avg: '$backend' },
          database: { $avg: '$database' },
          cloud: { $avg: '$cloud' },
          ml_ai: { $avg: '$ml_ai' },
          soft_skills: { $avg: '$soft_skills' }
        }
      }
    ]);

    res.json({ skillsByCategory: skillsByCategory[0] || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};