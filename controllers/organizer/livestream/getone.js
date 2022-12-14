const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const categoryModel = require('../../../models/eventcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const livestreamreviewModel = require('../../../models/livestreamreviews.model');
const userModel = require('../../../models/users.model');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).populate({
                    path: "event_category",
                    model: primary.model(constants.MODELS.eventcategories, categoryModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                if(livestreamData && livestreamData != null){
                    let noofreview = parseInt(await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).countDocuments({ livestreamid: mongoose.Types.ObjectId(livestreamData._id) }));
                    if (noofreview > 0) {
                        let totalReviewsCountObj = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).aggregate([{ $match: { livestreamid: mongoose.Types.ObjectId(livestreamData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                        if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                            livestreamData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / parseInt(noofreview)).toFixed(1);
                            livestreamData.totalreview = parseInt(noofreview);
                        }
                    } else {
                        livestreamData.ratings = '0.0';
                        livestreamData.totalreview = parseInt(0);
                    }
                    let allreview = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).find({ livestreamid: mongoose.Types.ObjectId(livestreamData._id) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name mobile profilepic createdAt timestamp" }).lean();
                    livestreamData.reviews = allreview;
                    return responseManager.onSuccess('Organizer event live stream data!', livestreamData, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event live stream id to get event live stream data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event live streaming, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event live streaming, please try again' }, res);
    }
};