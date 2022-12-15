let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const offlineofferwishlistModel = require('../../models/offlineofferwishlists.model');
const organizerModel = require('../../models/organizers.model');
const shopModel = require('../../models/shops.model');
const offlineofferModel = require('../../models/offlineoffers.model');
const shopreviewModel = require('../../models/shopreviews.model');
const mongoose = require('mongoose');
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { offerid } = req.body;
            if (offerid && offerid != '' && mongoose.Types.ObjectId.isValid(offerid)) {
                let existingwishlist = await primary.model(constants.MODELS.offlineofferwishlists, offlineofferwishlistModel).findOne({ offerid: mongoose.Types.ObjectId(offerid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                if (existingwishlist == null) {
                    let obj = {
                        offerid: mongoose.Types.ObjectId(offerid),
                        userid: mongoose.Types.ObjectId(req.token.userid),
                    };
                    await primary.model(constants.MODELS.offlineofferwishlists, offlineofferwishlistModel).create(obj);
                    return responseManager.onSuccess("Offer wishlist placed successfully!", 1, res);
                } else {
                    await primary.model(constants.MODELS.offlineofferwishlists, offlineofferwishlistModel).findOneAndRemove({ offerid: mongoose.Types.ObjectId(offerid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                    return responseManager.onSuccess("Offer wishlist remove successfully!", 1, res);
                }
            }else {
                return responseManager.badrequest({ message: 'Invalid offer id to add or remove wishlist offer data, please try again' }, res);
            }
        }else {
            return responseManager.badrequest({ message: 'Invalid user data to add or remove wishlist offer data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid user id to add or remove wishlist offer data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let mywishlist = await primary.model(constants.MODELS.offlineofferwishlists, offlineofferwishlistModel).find({userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            let allOffersId = [];
            async.forEachSeries(mywishlist, (wishlist, next_wishlist) => {
                if(wishlist.offerid && wishlist.offerid != '' && mongoose.Types.ObjectId.isValid(wishlist.offerid)){
                  allOffersId.push(mongoose.Types.ObjectId(wishlist.offerid));
                }
                next_wishlist();
            }, () => {
              primary.model(constants.MODELS.offlineoffers, offlineofferModel).find({
                _id: { $in: allOffersId }, status: true,
              }).populate([
                { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel) },
                { path: 'shopid', model: primary.model(constants.MODELS.shops, shopModel) }
              ]).lean().then((shopOffers) => {
                let alloffers = [];
                async.forEachSeries(shopOffers, (offer, next_offer) => {
                  (async () => {
                    let noofreview = parseInt(await primary.model(constants.MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(offer.shopid._id) }));
                    if (noofreview > 0) {
                      let totalReviewsCountObj = await primary.model(constants.MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(offer.shopid._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                      if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                        offer.shopid.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                        alloffers.push(offer);
                      }
                    } else {
                      offer.shopid.ratings = '0.0';
                      alloffers.push(offer);
                    }
                    next_offer();
                  })().catch((error) => { });
                }, () => {
                  return responseManager.onSuccess("Wishlist List", alloffers, res);
                });
              }).catch((error) => {
                return responseManager.onError(error, res);
              });
            });            
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get offer wishlist list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get offer wishlist list, please try again' }, res);
    }
});
module.exports = router;