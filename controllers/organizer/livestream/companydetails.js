const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.companydetails = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let obj = {
                    name: (req.body.name) ? req.body.name : '',
                    gst: (req.body.gst) ? req.body.gst : '',
                    contact_no: (req.body.contact_no) ? req.body.contact_no : '',
                    email: (req.body.email) ? req.body.email : '',
                    flat_no: (req.body.flat_no) ? req.body.flat_no : '',
                    street: (req.body.street) ? req.body.street : '',
                    area: (req.body.area) ? req.body.area : '',
                    city: (req.body.city) ? req.body.city : '',
                    state: (req.body.state) ? req.body.state : '',
                    pincode: (req.body.pincode) ? req.body.pincode : ''
                };
                await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), companydetail: obj });
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if(livestreamData && livestreamData != null){
                    return responseManager.onSuccess('Organizer event live stream company details updated successfully!', {
                        _id : livestreamData._id, 
                        companydetail : livestreamData.companydetail
                    }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event live stream id to set event live stream company details data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid live stream id to set event live streaming company details, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to set event live streaming company details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or set event live streaming company details, please try again' }, res);
    }
};
exports.getcompanydetails = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if(livestreamData && livestreamData != null){
                    return responseManager.onSuccess('Organizer event live stream company detail data!', {
                        _id : livestreamData._id, 
                        companydetail : livestreamData.companydetail
                    }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event livestream id get stream company details, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event livestream id get stream company details, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event stream company details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event stream company details, please try again' }, res);
    }
};