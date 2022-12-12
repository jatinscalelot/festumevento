const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const onlineofferModel = require('../../../../models/onlineoffers.model');
const mongoose = require('mongoose');
exports.remove = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { onlineofferid } = req.body;
            if (onlineofferid && onlineofferid != '' && mongoose.Types.ObjectId.isValid(onlineofferid)) {
                await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findByIdAndRemove(onlineofferid);
                return responseManager.onSuccess('Online offer data removed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid offer id to remove online offer data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to remove online offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};