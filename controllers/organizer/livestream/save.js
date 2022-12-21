const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const categoryModel = require('../../../models/eventcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.save = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid, event_name, event_category, event_description, event_date, event_start_time, event_end_time, event_type, price_per_user } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                if(event_name && event_name.trim() != ''){
                    if(event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)){
                        if(event_date && event_date != '' && event_start_time && event_start_time != '' && event_end_time && event_end_time != ''){
                            if(event_type && (event_type == 'free' || event_type == 'paid')){
                                if(!isNaN(price_per_user) && (price_per_user >= 0)){
                                    let x = event_date.split("/");
                                    let startTimestamp = new Date(x[1]+'-'+x[2]+'-'+x[0]+' '+event_start_time).getTime();
                                    let endTimestamp = new Date(x[1]+'-'+x[2]+'-'+x[0]+' '+event_end_time).getTime();
                                    let obj = {
                                        event_name: event_name,
                                        event_category: mongoose.Types.ObjectId(event_category),
                                        event_description: event_description,
                                        event_date: event_date,
                                        event_start_time: event_start_time,
                                        event_start_timestamp : startTimestamp,
                                        event_end_time: event_end_time,
                                        event_end_timestamp : endTimestamp, 
                                        event_type: event_type,
                                        price_per_user: parseFloat(price_per_user),
                                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                                        timestamp: Date.now()
                                    };
                                    await primary.model(constants.MODELS.livestreams, livestreamModel).findByIdAndUpdate(livestreamid, obj);
                                    let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).populate({
                                        path: "event_category",
                                        model: primary.model(constants.MODELS.eventcategories, categoryModel),
                                        select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                                    }).lean();
                                    if(livestreamData && livestreamData != null){
                                        return responseManager.onSuccess('Organizer event live stream updated successfully!', {
                                            _id : livestreamData._id, 
                                            event_name: livestreamData.event_name, 
                                            event_description: livestreamData.event_description, 
                                            event_category : livestreamData.event_category,
                                            event_date: livestreamData.event_date, 
                                            event_start_time: livestreamData.event_start_time,
                                            event_end_time: livestreamData.event_end_time, 
                                            event_type: livestreamData.event_type,
                                            price_per_user: parseFloat(livestreamData.price_per_user),
                                            status : livestreamData.status
                                        }, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Invalid event live stream id to set event live stream data, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Invalid event price per user to update event live stream data It can be either 0 or > 0, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Invalid event type to update event live stream data It can be free or paid only, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Invalid event time schedule to update event live stream data, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid event category to update event live stream data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid event name to update event live stream data, please try again' }, res);
                }
            }else{
                if(event_name && event_name.trim() != ''){
                    if(event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)){
                        if(event_date && event_date != '' && event_start_time && event_start_time != '' && event_end_time && event_end_time != ''){
                            if(event_type && (event_type == 'free' || event_type == 'paid')){
                                if(!isNaN(price_per_user) && (price_per_user >= 0)){
                                    let x = event_date.split("/");
                                    let startTimestamp = new Date(x[1]+'-'+x[2]+'-'+x[0]+' '+event_start_time).getTime();
                                    let endTimestamp = new Date(x[1]+'-'+x[2]+'-'+x[0]+' '+event_end_time).getTime();
                                    let obj = {
                                        event_name: event_name,
                                        event_category: mongoose.Types.ObjectId(event_category),
                                        event_description: event_description,
                                        event_date: event_date,
                                        event_start_time: event_start_time,
                                        event_start_timestamp : startTimestamp,
                                        event_end_time: event_end_time,
                                        event_end_timestamp : endTimestamp, 
                                        event_type: event_type,
                                        price_per_user: parseFloat(price_per_user),
                                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                                        timestamp: Date.now(),
                                        status: false
                                    };
                                    let createdLSdata = await primary.model(constants.MODELS.livestreams, livestreamModel).create(obj);
                                    let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(createdLSdata._id).populate({
                                        path: "event_category",
                                        model: primary.model(constants.MODELS.eventcategories, categoryModel),
                                        select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                                    }).lean();
                                    if(livestreamData && livestreamData != null){
                                        return responseManager.onSuccess('Organizer event live stream created successfully!', {
                                            _id : livestreamData._id, 
                                            event_name: livestreamData.event_name, 
                                            event_description: livestreamData.event_description, 
                                            event_category : livestreamData.event_category,
                                            event_date: livestreamData.event_date, 
                                            event_start_time: livestreamData.event_start_time,
                                            event_end_time: livestreamData.event_end_time, 
                                            event_type: livestreamData.event_type,
                                            price_per_user: parseFloat(livestreamData.price_per_user),
                                            status : livestreamData.status
                                        }, res);
                                    }else{
                                        return responseManager.badrequest({ message: 'Invalid event live stream id to create event live stream data, please try again' }, res);
                                    }
                                }else{
                                    return responseManager.badrequest({ message: 'Invalid event price per user to create event live stream data It can be either 0 or > 0, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({ message: 'Invalid event type to create event live stream data It can be free or paid only, please try again' }, res);
                            }
                        }else{
                            return responseManager.badrequest({ message: 'Invalid event time schedule to create event live stream data, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid event category to create event live stream data, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid event name to create event live stream data, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to create event live streaming, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or update event live streaming, please try again' }, res);
    }
};
exports.getlivestream = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { livestreamid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (livestreamid && livestreamid != '' && mongoose.Types.ObjectId.isValid(livestreamid)) {
                let livestreamData = await primary.model(constants.MODELS.livestreams, livestreamModel).findById(livestreamid).populate({
                    path: "event_category",
                    model: primary.model(constants.MODELS.eventcategories, categoryModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                if(livestreamData && livestreamData != null){
                    return responseManager.onSuccess('Organizer event live stream data!', {
                        _id : livestreamData._id, 
                        event_name: livestreamData.event_name, 
                        event_description: livestreamData.event_description, 
                        event_category : livestreamData.event_category,
                        event_date: livestreamData.event_date, 
                        event_start_time: livestreamData.event_start_time,
                        event_end_time: livestreamData.event_end_time, 
                        event_type: livestreamData.event_type,
                        price_per_user: parseFloat(livestreamData.price_per_user),
                        status : livestreamData.status
                    }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event livestream id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event livestream id get event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event livestream data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event livestream data, please try again' }, res);
    }
};