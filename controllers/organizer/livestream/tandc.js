const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const mongoose = require('mongoose');
exports.tandc = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                if (status && status == true) {
                    let obj = {
                        t_and_c: (req.body.t_and_c) ? req.body.t_and_c : '',
                        facebook: (req.body.facebook) ? req.body.facebook : '',
                        twitter: (req.body.twitter) ? req.body.twitter : '',
                        youtube: (req.body.youtube) ? req.body.youtube : '',
                        pinterest: (req.body.pinterest) ? req.body.pinterest : '',
                        instagram: (req.body.instagram) ? req.body.instagram : '',
                        linkedin: (req.body.linkedin) ? req.body.linkedin : '',
                        status: (req.body.status) ? req.body.status : false,
                    };
                    await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), tandc: obj });
                    let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                    if (livestreamData && livestreamData != null) {
                        let encId = await helper.passwordEncryptor(livestreamData._id);
                        await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, {media_content_link : '/livestream/mcl?lsd='+encId, join_user_link : '/livestream/jul?lsd='+encId}).lean();
                        return responseManager.onSuccess('Organizer event live stream tandc updated successfully!', {
                            _id: livestreamData._id,
                            tandc: livestreamData.tandc,
                            links : {
                                media_content_link : process.env.APP_URI + '/livestream/mcl?lsd='+encId,
                                join_user_link : process.env.APP_URI + '/livestream/jul?lsd='+encId,
                            }
                        }, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event live stream id to set event live stream tandc, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Please accept terms and condition to update tandc data for event live stream, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid live stream id to set event live streaming tandc, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set event live streaming tandc, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or set event live streaming tandc, please try again' }, res);
    }
};
exports.gettandc = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if (livestreamData && livestreamData != null) {
                    return responseManager.onSuccess('Organizer event live stream tandc data!', {
                        _id: livestreamData._id,
                        tandc: livestreamData.tandc,
                        links : {
                            media_content_link : (livestreamData.media_content_link) ? livestreamData.media_content_link : '',
                            join_user_link : (livestreamData.join_user_link) ? livestreamData.join_user_link : '',
                        }
                    }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event livestream id get stream tandc, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event livestream id get stream tandc, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event stream tandc, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event stream tandc, please try again' }, res);
    }
};