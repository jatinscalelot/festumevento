let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const onlineofferModel = require('../../models/onlineoffers.model');
const onlineofferreviewModel = require('../../models/onlineofferreviews.model');
const onlineofferwishlistModel = require('../../models/onlineofferwishlists.model');
const platformModel = require('../../models/platforms.model');
const mongoose = require('mongoose');
const async = require('async');
router.post('/findoffer', helper.authenticateToken, async (req, res) => {
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { search } = req.body;
      primary.model(constants.MODELS.onlineoffers, onlineofferModel).find({
        status: true, 
        $or: [
          { shop_name: { '$regex': new RegExp(search, "i") } },
          { start_date: { '$regex': new RegExp(search, "i") } },
          { end_date: { '$regex': new RegExp(search, "i") } },
          { product_name: {'$regex': new RegExp(search, "i") } },
          { description: { '$regex': new RegExp(search, "i") } },
          { company_name : { '$regex': new RegExp(search, "i") } },
          { company_contact_no : { '$regex': new RegExp(search, "i") } },
          { company_email : { '$regex': new RegExp(search, "i") } },
          { about_company : { '$regex': new RegExp(search, "i") } }
        ]
      }).populate([
        { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: 'name email mobile profile_pic' },
        { path : 'product_links.platform', model : primary.model(constants.MODELS.platforms, platformModel)}
      ]).lean().then((onlineOffers) => {
        let alloffers = [];
        async.forEachSeries(onlineOffers, (offer, next_offer) => {
          (async () => {
            let wishlist = await primary.model(constants.MODELS.onlineofferwishlists, onlineofferwishlistModel).findOne({offerid : mongoose.Types.ObjectId(offer._id), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            offer.wishlist_status = (wishlist == null) ? false : true;
            let noofreview = parseInt(await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).countDocuments({ offerid: mongoose.Types.ObjectId(offer._id) }));
            if (noofreview > 0) {
              let totalReviewsCountObj = await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).aggregate([{ $match: { offerid: mongoose.Types.ObjectId(offer._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
              if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                offer.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                offer.totalreviews = noofreview;
                alloffers.push(offer);
              }
            } else {
              offer.ratings = '0.0';
              offer.totalreviews = 0;
              alloffers.push(offer);
            }
            next_offer();
          })().catch((error) => { });
        }, () => {
          return responseManager.onSuccess("online offer List", { onlineshopoffer : alloffers}, res);
        });
      }).catch((error) => {
        return responseManager.onError(error, res);
      });
    } else {
      return responseManager.badrequest({ message: 'Invalid user request to find online offers, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to find online offers, please try again' }, res);
  }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { offerid } = req.body;
      if (offerid && offerid != '' && mongoose.Types.ObjectId.isValid(offerid)) {
        primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(offerid).populate([{
          path: 'createdBy',
          model: primary.model(constants.MODELS.organizers, organizerModel),
          select: 'name email mobile profile_pic'
        }, {
          path : 'product_links.platform', 
          model : primary.model(constants.MODELS.platforms, platformModel)
        }
        ]).lean().then((offerDetails) => {
          (async () => {
            let wishlist = await primary.model(constants.MODELS.onlineofferwishlists, onlineofferwishlistModel).findOne({offerid : mongoose.Types.ObjectId(offerDetails._id), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            offerDetails.wishlist_status = (wishlist == null) ? false : true;
            let user_review = await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).findOne({ offerid: mongoose.Types.ObjectId(offerDetails._id), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
            offerDetails.is_user_review = (user_review == null) ? false : true;
            let noofreview = parseInt(await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).countDocuments({ offerid: mongoose.Types.ObjectId(offerDetails._id) }));
            if (noofreview > 0) {
              let totalReviewsCountObj = await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).aggregate([{ $match: { offerid: mongoose.Types.ObjectId(offerDetails._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
              if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                offerDetails.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                offerDetails.totalreviews = noofreview;
              }
            } else {
              offerDetails.ratings = '0.0';
              offerDetails.totalreviews = 0;
            }
            let allreview = await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).find({ offerid: mongoose.Types.ObjectId(offerDetails._id) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name mobile profilepic" }).lean();
            offerDetails.offerreviews = allreview;
            return responseManager.onSuccess("online offer data", offerDetails, res);
          })().catch((error) => {
            return responseManager.onError(error, res);
          });
        }).catch((error) => {
          return responseManager.onError(error, res);
        });
      } else {
        return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid user id to find online offer data, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to get online offer data, please try again' }, res);
  }
});
router.post('/rate', helper.authenticateToken, async (req, res) => {
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { offerid, ratings, title, review } = req.body;
      if (offerid && offerid != '' && mongoose.Types.ObjectId.isValid(offerid)) {
        let existingreview = await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).findOne({ offerid: mongoose.Types.ObjectId(offerid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
        if (existingreview == null) {
          if (!isNaN(ratings) && title && title.trim() != '' && review && review.trim() != '') {
            let obj = {
              offerid: mongoose.Types.ObjectId(offerid),
              userid: mongoose.Types.ObjectId(req.token.userid),
              ratings: parseFloat(ratings),
              title: title,
              review: review,
              timestamp: Date.now()
            };
            await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).create(obj);
            return responseManager.onSuccess("Online offer review placed successfully!", 1, res);
          } else {
            return responseManager.badrequest({ message: 'Invalid data to place review for the online offer, please try again' }, res);
          }
        } else {
          return responseManager.badrequest({ message: 'Review already register for the online offer, please try again with other event' }, res);
        }
      } else {
        return responseManager.badrequest({ message: 'Invalid offer id to rate online offer data, please try again' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid user id to rate online offer data, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to rate online offer data, please try again' }, res);
  }
});
module.exports = router;