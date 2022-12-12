const shopModel = require('../../../models/shops.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const offlineofferModel = require('../../../models/offlineoffers.model');
const mongoose = require('mongoose');
exports.remove = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                await primary.model(constants.MODELS.shops, shopModel).findByIdAndRemove(shopid);
                await primary.model(constants.MODELS.offlineoffers, offlineofferModel).deleteMany({shopid : mongoose.Types.ObjectId(shopid)});
                return responseManager.onSuccess('Shop data removed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid shop id to remove Shop, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to remove Shop, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};