const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.media = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid, photos, videos } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let obj = {
                    photos: photos,
                    videos: videos
                };
                await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, obj);
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if(livestreamData && livestreamData != null){
                    return responseManager.onSuccess('Organizer event live stream media updated successfully!', {
                        _id : livestreamData._id, 
                        photos: livestreamData.photos, 
                        videos: livestreamData.videos
                    }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event live stream id to set event live stream media data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid live stream id to set event live streaming medias, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to set event live streaming medias, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or set event live streaming medias, please try again' }, res);
    }
};
exports.getmedia = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if(livestreamData && livestreamData != null){
                    return responseManager.onSuccess('Organizer event live stream data!', {
                        _id : livestreamData._id, 
                        photos: livestreamData.photos, 
                        videos: livestreamData.videos
                    }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event livestream id get stream media data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event livestream id get stream media data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event stream media data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event stream media data, please try again' }, res);
    }
};