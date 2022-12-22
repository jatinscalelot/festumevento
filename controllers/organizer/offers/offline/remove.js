const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const offlineofferModel = require('../../../../models/offlineoffers.model');
const mongoose = require('mongoose');
exports.remove = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { shopid, offlineofferid } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid) && offlineofferid && offlineofferid != '' && mongoose.Types.ObjectId.isValid(offlineofferid)) {
                await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findByIdAndRemove(offlineofferid).lean();
                return responseManager.onSuccess('Offline offer data removed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid shop id to remove offline offer data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to remove offline offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};