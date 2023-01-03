const shopModel = require('../../../models/shops.model');
const organizerModel = require('../../../models/organizers.model');
const shopcategoryModel = require('../../../models/shopcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const shopreviewModel = require('../../../models/shopreviews.model');
const mongoose = require('mongoose');
const async = require('async');
exports.list = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.shops, shopModel).paginate({
                $or: [
                    { shop_name: { '$regex': new RegExp(search, "i") } },
                    { about_shop: { '$regex': new RegExp(search, "i") } },
                    { flat_no: { '$regex': new RegExp(search, "i") } },
                    { street_name: { '$regex': new RegExp(search, "i") } },
                    { area_name: { '$regex': new RegExp(search, "i") } },
                    { city: { '$regex': new RegExp(search, "i") } },
                    { state: { '$regex': new RegExp(search, "i") } },
                    { pincode: { '$regex': new RegExp(search, "i") } }
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                populate: { path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description" },
                lean: true
            }).then((shoplist) => {
                let finalShops = [];
                async.forEachSeries(shoplist.docs, (shop, next_shop) => {
                    (async () => {
                        let noofreview = parseInt(await primary.model(constants.MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(shop._id) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await primary.model(constants.MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(shop._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                shop.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                shop.totalreviews = noofreview;
                                finalShops.push(shop);
                            }
                        } else {
                            shop.ratings = '0.0';
                            shop.totalreviews = 0;
                            finalShops.push(shop);
                        }
                        next_shop();
                    })().catch((error) => { });
                }, () => {
                    shoplist.docs = finalShops;
                    return responseManager.onSuccess('Shops list!', shoplist, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get Shop list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};