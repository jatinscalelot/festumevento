const shopModel = require('../../../models/shops.model');
const organizerModel = require('../../../models/organizers.model');
const shopcategoryModel = require('../../../models/shopcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const shopreviewModel = require('../../../models/shopreviews.model');
const offlineofferModel = require('../../../models/offlineoffers.model');
const userModel = require('../../../models/users.model');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).populate({ path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description" }).lean();
                let noofreview = parseInt(await primary.model(constants.MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(shopid) }));
                if (noofreview > 0) {
                    let totalReviewsCountObj = await primary.model(constants.MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(shopid) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                    if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                        shopData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                        shopData.totalreviews = noofreview;
                    }
                } else {
                    shopData.ratings = '0.0';
                    shopData.totalreviews = 0;
                }
                let allreviews = await primary.model(constants.MODELS.shopreviews, shopreviewModel).find({ shopid: mongoose.Types.ObjectId(shopid) }).populate([{ path : 'offerid', model : primary.model(constants.MODELS.offlineoffers, offlineofferModel), select : 'offer_title start_date end_date poster'}, {path : 'userid', model : primary.model(constants.MODELS.users, userModel), select : 'name email country_code mobile profilepic'}]).lean();
                shopData.reviews = allreviews;
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