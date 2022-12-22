var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const offlineofferModel = require('../../models/offlineoffers.model');
const onlineofferModel = require('../../models/onlineoffers.model');
const livestreamModel = require('../../models/livestreams.model');
const responseManager = require('../../utilities/response.manager');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const mongoose = require('mongoose');
const eventcategoryModel = require('../../models/eventcategories.model');
const async = require('async');
router.get('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            let finalArray = [];
            let allEvents = await primary.model(constants.MODELS.events, eventModel).find({createdBy : mongoose.Types.ObjectId(req.token.organizerid)}).select('photos videos name event_category event_type other').populate({path : 'event_category', model : primary.model(constants.MODELS.eventcategories, eventcategoryModel), select : 'categoryname'}).sort({_id : -1}).lean();
            let allOfflineOffers = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).find({ createdBy : mongoose.Types.ObjectId(req.token.organizerid)}).select('offer_title poster video').sort({_id : -1}).lean();
            let allOnlineOffers = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).find({createdBy : mongoose.Types.ObjectId(req.token.organizerid)}).select('shop_name poster images').sort({_id : -1}).lean();
            let allLiveStreaming = await primary.model(constants.MODELS.livestreams, livestreamModel).find({createdBy : mongoose.Types.ObjectId(req.token.organizerid)}).select('event_name event_category photos videos').populate({path : 'event_category', model : primary.model(constants.MODELS.eventcategories, eventcategoryModel), select : 'categoryname'}).sort({_id : -1}).lean();
            async.forEachSeries(allEvents, (event, next_event) => {
                async.forEachSeries(event.photos, (photo, next_photo) => {
                    let obj = {
                        _id : event._id,
                        url : photo.url,
                        type : 'event',
                        media : 'photo',
                        name : event.name,
                        event_type : event.event_type,
                        category : (event.event_category && event.event_category.categoryname) ? event.event_category.categoryname : event.other
                    };
                    finalArray.push(obj);
                    next_photo();
                }, () => {
                    async.forEachSeries(event.videos, (video, next_video) => {
                        let obj = {
                            _id : event._id,
                            url : video.url,
                            type : 'event',
                            media : 'video',
                            name : event.name,
                            event_type : event.event_type,
                            category : (event.event_category && event.event_category.categoryname) ? event.event_category.categoryname : event.other
                        };
                        finalArray.push(obj);
                        next_video();
                    }, () => {
                        next_event();
                    });
                });
            }, () => {
                async.forEachSeries(allOfflineOffers, (offlineoffer, next_offlineoffer) => {
                    if(offlineoffer.poster && offlineoffer.poster != ''){
                        let obj = {
                            _id : offlineoffer._id,
                            url : offlineoffer.poster,
                            type : 'offlineoffer',
                            media : 'photo',
                            name : offlineoffer.offer_title,
                            event_type : '',
                            category : ''
                        };
                        finalArray.push(obj);
                    }
                    if(offlineoffer.video && offlineoffer.video != ''){
                        let obj = {
                            _id : offlineoffer._id,
                            url : offlineoffer.video,
                            type : 'offlineoffer',
                            media : 'video',
                            name : offlineoffer.offer_title,
                            event_type : '',
                            category : ''
                        };
                        finalArray.push(obj);
                    }
                    next_offlineoffer();
                }, () => {
                    async.forEachSeries(allOnlineOffers, (onlineoffer, next_onlineoffer) => {
                        if(onlineoffer.poster && onlineoffer.poster != ''){
                            let obj = {
                                _id : onlineoffer._id,
                                url : onlineoffer.poster,
                                type : 'onlineoffer',
                                media : 'photo',
                                name : onlineoffer.shop_name,
                                event_type : '',
                                category : ''
                            };
                            finalArray.push(obj);
                        }
                        async.forEachSeries(onlineoffer.images, (online_image, next_online_image) => {
                            let obj = {
                                _id : onlineoffer._id,
                                url : online_image.url,
                                type : 'onlineoffer',
                                media : 'photo',
                                name : onlineoffer.shop_name,
                                event_type : '',
                                category : ''
                            };
                            finalArray.push(obj);
                            next_online_image();
                        }, () => {
                            next_onlineoffer();
                        })
                    }, () => {
                        async.forEachSeries(allLiveStreaming, (lstream, next_lstream) => {
                            async.forEachSeries(lstream.photos, (lphoto, next_lphoto) => {
                                let obj = {
                                    _id : lstream._id,
                                    url : lphoto.url,
                                    type : 'livestream',
                                    media : 'photo',
                                    name : lstream.event_name,
                                    event_type : '',
                                    category : (lstream.event_category && lstream.event_category.categoryname) ? lstream.event_category.categoryname : ''
                                };
                                finalArray.push(obj);
                                next_lphoto();
                            }, () => {
                                async.forEachSeries(lstream.videos, (lvideo, next_lvideo) => {
                                    let obj = {
                                        _id : lstream._id,
                                        url : lvideo.url,
                                        type : 'livestream',
                                        media : 'video',
                                        name : lstream.event_name,
                                        event_type : '',
                                        category : (lstream.event_category && lstream.event_category.categoryname) ? lstream.event_category.categoryname : ''
                                    };
                                    finalArray.push(obj);
                                    next_lvideo();
                                }, () => {
                                    next_lstream();
                                });
                            });
                        }, () => {
                            return responseManager.onSuccess('Entertainment Data', finalArray, res);
                        });
                    });
                });
            });
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get entertainment data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get entertainment data, please try again' }, res);
    }
});
module.exports = router;