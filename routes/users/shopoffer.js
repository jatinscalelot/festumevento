let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const shopModel = require('../../models/shops.model');
const offlineofferModel = require('../../models/offlineoffers.model');
const shopreviewModel = require('../../models/shopreviews.model');
const offlineofferwishlistModel = require('../../models/offlineofferwishlists.model');
const mongoose = require('mongoose');
const async = require('async');
function validateLatLng(lat, lng) {
  let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
  return pattern.test(lat) && pattern.test(lng);
};
router.post('/findoffer', helper.authenticateToken, async (req, res) => {
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { latitude, longitude, search } = req.body;
      if (latitude && longitude && latitude != '' && longitude != '' && latitude != null && longitude != null && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
        let parentQuery = {
          "location": {
            $geoWithin: {
              $centerSphere: [
                [
                  parseFloat(longitude), parseFloat(latitude)
                ],
                (parseInt(100) * 0.62137119) / 3963.2
              ]
            }
          }
        };
        primary.model(constants.MODELS.shops, shopModel).find({
          status: true,
          ...parentQuery
        }).lean().then((shopList) => {
          let shopIds = [];
          async.forEachSeries(shopList, (shop, next_shop) => {
            shopIds.push(mongoose.Types.ObjectId(shop._id));
            next_shop();
          }, () => {
            if (shopIds.length > 0) {
              primary.model(constants.MODELS.offlineoffers, offlineofferModel).find({
                shopid: { $in: shopIds }, status: true, $or: [
                  { offer_title: { '$regex': new RegExp(search, "i") } },
                  { start_date: { '$regex': new RegExp(search, "i") } },
                  { end_date: { '$regex': new RegExp(search, "i") } },
                  { description: { '$regex': new RegExp(search, "i") } }
                ]
              }).populate([
                { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: 'name email mobile profile_pic' },
                { path: 'shopid', model: primary.model(constants.MODELS.shops, shopModel) }
              ]).lean().then((shopOffers) => {
                let alloffers = [];
                async.forEachSeries(shopOffers, (offer, next_offer) => {
                  (async () => {
                    let wishlist = await primary.model(constants.MODELS.offlineofferwishlists, offlineofferwishlistModel).findOne({offerid : mongoose.Types.ObjectId(offer._id), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
                    offer.wishlist_status = (wishlist == null) ? false : true;
                    let noofreview = parseInt(await primary.model(constants.MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(offer.shopid._id), offerid : mongoose.Types.ObjectId(offer._id) }));
                    if (noofreview > 0) {
                      let totalReviewsCountObj = await primary.model(constants.MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(offer.shopid._id), offerid : mongoose.Types.ObjectId(offer._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                      if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                        offer.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                        alloffers.push(offer);
                      }
                    } else {
                      offer.ratings = '0.0';
                      alloffers.push(offer);
                    }
                    next_offer();
                  })().catch((error) => { });
                }, () => {
                  return responseManager.onSuccess("shop offer List", alloffers, res);
                });
              }).catch((error) => {
                return responseManager.onError(error, res);
              });
            } else {
              return responseManager.onSuccess("shop offer List", [], res);
            }
          });
        }).catch((error) => {
          return responseManager.onError(error, res);
        });
      } else {
        return responseManager.badrequest({ message: 'Invalid latitude and logitude to find shop offer near by you, please try again' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid user request to find shop offer near by you, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to find shop offer near by you, please try again' }, res);
  }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { offerid } = req.body;
      if (offerid && offerid != '' && mongoose.Types.ObjectId.isValid(offerid)) {
        primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offerid).populate([{
          path: 'createdBy',
          model: primary.model(constants.MODELS.organizers, organizerModel),
          select: 'name email mobile profile_pic'
        }, {
          path: 'shopid',
          model: primary.model(constants.MODELS.shops, shopModel)
        }
        ]).lean().then((offerDetails) => {
          (async () => {
            let wishlist = await primary.model(constants.MODELS.offlineofferwishlists, offlineofferwishlistModel).findOne({offerid : mongoose.Types.ObjectId(offerDetails._id), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            offerDetails.wishlist_status = (wishlist == null) ? false : true;
            let noofreview = parseInt(await primary.model(constants.MODELS.shopreviews, shopreviewModel).countDocuments({ shopid: mongoose.Types.ObjectId(offerDetails.shopid._id), offerid : mongoose.Types.ObjectId(offerDetails._id) }));
            if (noofreview > 0) {
              let totalReviewsCountObj = await primary.model(constants.MODELS.shopreviews, shopreviewModel).aggregate([{ $match: { shopid: mongoose.Types.ObjectId(offerDetails.shopid._id), offerid : mongoose.Types.ObjectId(offerDetails._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
              if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                offerDetails.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
              }
            } else {
              offerDetails.ratings = '0.0';
            }
            let allreview = await primary.model(constants.MODELS.shopreviews, shopreviewModel).find({ shopid: mongoose.Types.ObjectId(offerDetails.shopid._id), offerid : mongoose.Types.ObjectId(offerDetails._id) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name mobile profilepic" }).lean();
            offerDetails.reviews = allreview;
            return responseManager.onSuccess("shop offer data", offerDetails, res);
          })().catch((error) => {
            return responseManager.onError(error, res);
          });
        }).catch((error) => {
          return responseManager.onError(error, res);
        });
      } else {
        return responseManager.badrequest({ message: 'Invalid offer id to get offer data, please try again' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid user id to find offer data, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to get offer data, please try again' }, res);
  }
});
router.post('/rate', helper.authenticateToken, async (req, res) => {
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { shopid, offerid, ratings, title, review } = req.body;
      if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid) && offerid && offerid != '' && mongoose.Types.ObjectId.isValid(offerid)) {
        let existingreview = await primary.model(constants.MODELS.shopreviews, shopreviewModel).findOne({ shopid: mongoose.Types.ObjectId(shopid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
        if (existingreview == null) {
          if (!isNaN(ratings) && title && title.trim() != '' && review && review.trim() != '') {
            let obj = {
              shopid: mongoose.Types.ObjectId(shopid),
              offerid: mongoose.Types.ObjectId(offerid),
              userid: mongoose.Types.ObjectId(req.token.userid),
              ratings: parseFloat(ratings),
              title: title,
              review: review,
              timestamp: Date.now()
            };
            await primary.model(constants.MODELS.shopreviews, shopreviewModel).create(obj);
            return responseManager.onSuccess("Shop review placed successfully!", 1, res);
          } else {
            return responseManager.badrequest({ message: 'Invalid data to place review for the shop, please try again' }, res);
          }
        } else {
          return responseManager.badrequest({ message: 'Review already register for the shop, please try again with other event' }, res);
        }
      } else {
        return responseManager.badrequest({ message: 'Invalid shop id or offer id to rate event data, please try again' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid user id to rate shop data, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to rate shop data, please try again' }, res);
  }
});
module.exports = router;