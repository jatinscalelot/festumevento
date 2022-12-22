const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const onlineofferModel = require('../../../../models/onlineoffers.model');
const platformModel = require('../../../../models/platforms.model');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { onlineofferid } = req.body;
            if (onlineofferid && onlineofferid != '' && mongoose.Types.ObjectId.isValid(onlineofferid)) {
                let onlineOfferData = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(onlineofferid).populate({
                    path : 'product_links.platform',
                    model : primary.model(constants.MODELS.platforms, platformModel),
                    select : 'name platformimage'
                }).lean();
                if (onlineOfferData && onlineOfferData.createdBy.toString() == req.token.organizerid.toString()) {
                    return responseManager.onSuccess('Online offer data!', onlineOfferData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get online offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};