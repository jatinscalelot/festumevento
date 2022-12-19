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
        { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel) },
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
                alloffers.push(offer);
              }
            } else {
              offer.ratings = '0.0';
              alloffers.push(offer);
            }
            next_offer();
          })().catch((error) => { });
        }, () => {
          return responseManager.onSuccess("online offer List", alloffers, res);
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
module.exports = router;