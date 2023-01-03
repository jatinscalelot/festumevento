const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const offlineofferModel = require('../../../../models/offlineoffers.model');
const shopreviewModel = require('../../../../models/shopreviews.model');
const userModel = require('../../../../models/users.model');
const mongoose = require('mongoose');
const async = require('async');
exports.getone = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { shopid, offlineofferid } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid) && offlineofferid && offlineofferid != '' && mongoose.Types.ObjectId.isValid(offlineofferid)) {
                let offlineOfferData = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                if (offlineOfferData && offlineOfferData.shopid.toString() == shopid.toString()) {
                    let noofreview = parseInt(await primary.model(constants.MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(shopid), offerid : mongoose.Types.ObjectId(offlineofferid) }));
                    if (noofreview > 0) {
                      let totalReviewsCountObj = await primary.model(constants.MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(shopid), offerid : mongoose.Types.ObjectId(offlineofferid) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                      if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                        offlineOfferData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                        offlineOfferData.totalreview = noofreview;
                      }
                    } else {
                        offlineOfferData.ratings = '0.0';
                        offlineOfferData.totalreview = 0;
                    }
                    let allreview = await primary.model(constants.MODELS.shopreviews, shopreviewModel).find({ shopid: mongoose.Types.ObjectId(shopid), offerid : mongoose.Types.ObjectId(offlineofferid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name mobile profilepic" }).lean();
                    offlineOfferData.reviews = allreview;
                    return responseManager.onSuccess("shop offer data", offlineOfferData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid shop id to get offline offer data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid shop id to get offline offer data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get offline offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};