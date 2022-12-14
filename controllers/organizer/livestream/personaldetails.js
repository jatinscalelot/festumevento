const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.personaldetails = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let obj = {
                    full_name: (req.body.full_name) ? req.body.full_name : '',
                    mobile_no: (req.body.mobile_no) ? req.body.mobile_no : '',
                    is_mobile_hidden: (req.body.is_mobile_hidden) ? req.body.is_mobile_hidden : false,
                    alt_mobile_no: (req.body.alt_mobile_no) ? req.body.alt_mobile_no : '',
                    is_alt_mobile_hidden: (req.body.is_alt_mobile_hidden) ? req.body.is_alt_mobile_hidden : false,
                    email: (req.body.email) ? req.body.email : '',
                    is_email_hidden: (req.body.is_email_hidden) ? req.body.is_email_hidden : false,
                    flat_no: (req.body.flat_no) ? req.body.flat_no : '',
                    street: (req.body.street) ? req.body.street : '',
                    area: (req.body.area) ? req.body.area : '',
                    city: (req.body.city) ? req.body.city : '',
                    state: (req.body.state) ? req.body.state : '',
                    pincode: (req.body.pincode) ? req.body.pincode : ''
                };
                await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), personaldetail: obj });
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if (livestreamData && livestreamData != null) {
                    return responseManager.onSuccess('Organizer event live stream personal details updated successfully!', {
                        _id: livestreamData._id,
                        personaldetail: livestreamData.personaldetail
                    }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event live stream id to set event live stream personal details, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid live stream id to set event live streaming personal details, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set event live streaming personal details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or set event live streaming personal details, please try again' }, res);
    }
};
exports.getpersonaldetails = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if (livestreamData && livestreamData != null) {
                    return responseManager.onSuccess('Organizer event live stream personal details data!', {
                        _id: livestreamData._id,
                        personaldetail: livestreamData.personaldetail
                    }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event livestream id get stream personal details, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event livestream id get stream personal details, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event stream personal details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event stream personal details, please try again' }, res);
    }
};