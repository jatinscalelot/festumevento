let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const livestreamModel = require('../../models/livestreams.model');
const eventcategoriesModel = require('../../models/eventcategories.model');
const livestreamreviewModel = require('../../models/livestreamreviews.model');
const livestreamwishlistModel = require('../../models/livestreamwishlists.model');
const mongoose = require('mongoose');
const async = require('async');
router.post('/findlivestreams', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { search } = req.body;
            primary.model(constants.MODELS.livestreams, livestreamModel).find({
                status: true,
                $or: [
                    { event_name: { '$regex': new RegExp(search, "i") } },
                    { event_description: { '$regex': new RegExp(search, "i") } },
                    { event_date: { '$regex': new RegExp(search, "i") } },
                    { event_start_time: { '$regex': new RegExp(search, "i") } },
                    { event_end_time: { '$regex': new RegExp(search, "i") } },
                    { event_type: { '$regex': new RegExp(search, "i") } },
                    { "companydetail.name": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.contact_no": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.email": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.street": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.area": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.city": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.state": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.pincode": { '$regex': new RegExp(search, "i") } }
                ]
            }).populate([{
                path: 'createdBy',
                model: primary.model(constants.MODELS.organizers, organizerModel),
                select: 'name email mobile profile_pic'
            }, {
                path: 'event_category',
                model: primary.model(constants.MODELS.eventcategories, eventcategoriesModel),
                select: 'categoryname description'
            }]).select("event_name photos event_date event_start_timestamp event_end_timestamp event_type price_per_user").lean().then((result) => {
                let liveStream = [];
                let upcomingStream = [];
                let currentTime = Date.now() + 19800000;
                async.forEachSeries(result, (lstream, next_lstream) => {
                    (async () => {
                        let wishlist = await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).findOne({ livestreamid: mongoose.Types.ObjectId(lstream._id), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                        lstream.wishlist_status = (wishlist == null) ? false : true;
                        let noofreview = parseInt(await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).countDocuments({ livestreamid: mongoose.Types.ObjectId(lstream._id) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).aggregate([{ $match: { livestreamid: mongoose.Types.ObjectId(lstream._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                lstream.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                if (lstream.event_start_timestamp && lstream.event_end_timestamp && (lstream.event_start_timestamp <= currentTime && lstream.event_end_timestamp >= currentTime)) {
                                    liveStream.push(lstream);
                                } else if (lstream.event_start_timestamp && lstream.event_end_timestamp && (lstream.event_start_timestamp > currentTime && lstream.event_end_timestamp > currentTime)) {
                                    upcomingStream.push(lstream);
                                }
                            }
                        } else {
                            lstream.ratings = '0.0';
                            if (lstream.event_start_timestamp && lstream.event_end_timestamp && (lstream.event_start_timestamp <= currentTime && lstream.event_end_timestamp >= currentTime)) {
                                liveStream.push(lstream);
                            } else if (lstream.event_start_timestamp && lstream.event_end_timestamp && (lstream.event_start_timestamp > currentTime && lstream.event_end_timestamp > currentTime)) {
                                upcomingStream.push(lstream);
                            }
                        }
                        next_lstream();
                    })().catch((error) => { console.log('error', error); })
                }, () => {
                    return responseManager.onSuccess("Live Stream List", { liveStream: liveStream, upcomingStream: upcomingStream }, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid user request to find live stream list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to find live stream list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { livestreamid } = req.body;
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).populate([{
                    path: 'createdBy',
                    model: primary.model(constants.MODELS.organizers, organizerModel),
                    select: 'name email mobile profile_pic'
                }, {
                    path: 'event_category',
                    model: primary.model(constants.MODELS.eventcategories, eventcategoriesModel),
                    select: 'categoryname description'
                }]).lean().then((result) => {
                    (async () => {
                        let wishlist = await primary.model(constants.MODELS.livestreamwishlists, livestreamwishlistModel).findOne({ livestreamid: mongoose.Types.ObjectId(livestreamid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                        result.wishlist_status = (wishlist == null) ? false : true;
                        let noofreview = parseInt(await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).countDocuments({ livestreamid: mongoose.Types.ObjectId(livestreamid) }));
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).aggregate([{ $match: { livestreamid: mongoose.Types.ObjectId(livestreamid) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                result.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                            }
                        } else {
                            result.ratings = '0.0';
                        }
                        let allreview = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).find({ livestreamid: mongoose.Types.ObjectId(livestreamid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name mobile profilepic" }).lean();
                        result.reviews = allreview;
                        return responseManager.onSuccess("Live Stream data", result, res);
                    })().catch((error) => { console.log('error', error); });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid live stream id to get stream data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to find stream data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get stream data, please try again' }, res);
    }
});
router.post('/rate', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { livestreamid, ratings, title, review } = req.body;
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let existingreview = await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).findOne({ livestreamid: mongoose.Types.ObjectId(livestreamid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                if (existingreview == null) {
                    if (!isNaN(ratings) && title && title.trim() != '' && review && review.trim() != '') {
                        let obj = {
                            livestreamid: mongoose.Types.ObjectId(livestreamid),
                            userid: mongoose.Types.ObjectId(req.token.userid),
                            ratings: parseFloat(ratings),
                            title: title,
                            review: review,
                            timestamp: Date.now()
                        };
                        await primary.model(constants.MODELS.livestreamreviews, livestreamreviewModel).create(obj);
                        return responseManager.onSuccess("Live Stream review placed successfully!", 1, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid data to place review for the live stream, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Review already register for the live stream, please try again with other event' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to rate live stream data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to rate live stream data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to rate live stream data, please try again' }, res);
    }
});
module.exports = router;