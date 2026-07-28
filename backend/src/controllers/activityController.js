import { getActivityFeed } from '../services/activityService.js';
import { success } from '../utils/apiResponse.js';

export const getActivity = async (req, res, next) => {
  try {
    const feed = await getActivityFeed();
    return success(res, feed);
  } catch (error) {
    next(error);
  }
};
