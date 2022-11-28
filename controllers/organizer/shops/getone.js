const shopModel = require('../../../models/shops.model');
const organizerModel = require('../../../models/organizers.model');
const shopcategoryModel = require('../../../models/shopcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).populate({ path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description" }).lean();
                return responseManager.onSuccess('Shop data!', shopData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid shop id to get Shop data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get Shop data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};