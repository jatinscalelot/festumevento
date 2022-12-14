const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.remove = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).lean();
                if(livestreamData && livestreamData.createdBy.toString() == req.token.organizerid.toString()){
                    await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndRemove(livestreamid);
                    return responseManager.onSuccess('Organizer live stream data removed successfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event live stream id to remove event live stream data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event live stream id to remove event live stream data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to remove event live streaming, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to remove event live streaming, please try again' }, res);
    }
};