let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const livestreamwishlistModel = require('../../models/livestreamwishlists.model');
const organizerModel = require('../../models/organizers.model');
const livestreamModel = require('../../models/livestreams.model');
const livestreamreviewModel = require('../../models/livestreamreviews.model');
const eventcategoriesModel = require('../../models/eventcategories.model');
const mongoose = require('mongoose');
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      const { livestreamid } = req.body;
      if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
        let existingwishlist = await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).findOne({ livestreamid: mongoose.Types.ObjectId(livestreamid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
        if (existingwishlist == null) {
          let obj = {
            livestreamid: mongoose.Types.ObjectId(livestreamid),
            userid: mongoose.Types.ObjectId(req.token.userid),
          };
          await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).create(obj);
          return responseManager.onSuccess("Live Stream wishlist placed successfully!", 1, res);
        } else {
          await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).findOneAndRemove({ livestreamid: mongoose.Types.ObjectId(livestreamid), userid: mongoose.Types.ObjectId(req.token.userid) });
          return responseManager.onSuccess("Live Stream wishlist remove successfully!", 1, res);
        }
      } else {
        return responseManager.badrequest({ message: 'Invalid livestream id to add or remove wishlist livestream data, please try again' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid user data to add or remove wishlist livestream data, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid user id to add or remove wishlist livestream data, please try again' }, res);
  }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    if (userdata && userdata.status == true && userdata.mobileverified == true) {
      let mywishlist = await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).find({ userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
      let alllivestreamIds = [];
      async.forEachSeries(mywishlist, (wishlist, next_wishlist) => {
        if (wishlist.livestreamid && wishlist.livestreamid != '' && mongoose.Types.ObjectId.isValid(wishlist.livestreamid)) {
          alllivestreamIds.push(mongoose.Types.ObjectId(wishlist.livestreamid));
        }
        next_wishlist();
      }, () => {
        primary.model(constants.MODELS.livestreams, livestreamModel).find({
          _id: { $in: alllivestreamIds }, status: true,
        }).populate([{
          path: 'createdBy',
          model: primary.model(constants.MODELS.organizers, organizerModel),
          select: 'name email mobile profile_pic'
        }, {
          path: 'event_category',
          model: primary.model(constants.MODELS.eventcategories, eventcategoriesModel),
          select: 'categoryname description'
        }]).select("event_name photos event_date event_start_time event_start_timestamp event_end_time event_end_timestamp event_type price_per_user").lean().then((result) => {
          let liveStream = [];
          async.forEachSeries(result, (lstream, next_lstream) => {
            (async () => {
              let wishlist = await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).findOne({ livestreamid: mongoose.Types.ObjectId(lstream._id), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
              lstream.wishlist_status = (wishlist == null) ? false : true;
              let noofreview = parseInt(await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).countDocuments({ livestreamid: mongoose.Types.ObjectId(lstream._id) }));
              if (noofreview > 0) {
                let totalReviewsCountObj = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).aggregate([{ $match: { livestreamid: mongoose.Types.ObjectId(lstream._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                  lstream.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                  lstream.totalreviews = noofreview;
                  liveStream.push(lstream);
                }
              } else {
                lstream.ratings = '0.0';
                lstream.totalreviews = 0;
                liveStream.push(lstream);
              }
              next_lstream();
            })().catch((error) => { console.log('error', error); });
          }, () => {
            return responseManager.onSuccess("Live Stream wishlist List", liveStream, res);
          });
        }).catch((error) => {
          return responseManager.onError(error, res);
        });
      });
    } else {
      return responseManager.badrequest({ message: 'Invalid userid to get livestream wishlist list, please try again' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid token to get livestream wishlist list, please try again' }, res);
  }
});
module.exports = router;