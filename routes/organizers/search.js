var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const mongoose = require('mongoose');
const organizerModel = require('../../models/organizers.model');
const categoryModel = require('../../models/eventcategories.model');
const shopcategoryModel = require('../../models/shopcategories.model');
const shopModel = require('../../models/shops.model');
const eventModel = require('../../models/events.model');
const offlineofferModel = require('../../models/offlineoffers.model');
const onlineofferModel = require('../../models/onlineoffers.model');
const platformModel = require('../../models/platforms.model');
const livestreamModel = require('../../models/livestreams.model');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            const { search } = req.body;
            let events = await primary.model(constants.MODELS.events, eventModel).find({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } },
                    { other : { '$regex' : new RegExp(search, "i") } },
                    { "about.start_date" : { '$regex' : new RegExp(search, "i") } },
                    { "about.end_date" : { '$regex' : new RegExp(search, "i") } },
                    { "about.about_event" : { '$regex' : new RegExp(search, "i") } },
                    { "event_location.flat_no" : { '$regex' : new RegExp(search, "i") } },
                    { "event_location.street_name" : { '$regex' : new RegExp(search, "i") } },
                    { "event_location.area_name" : { '$regex' : new RegExp(search, "i") } },
                    { "event_location.city" : { '$regex' : new RegExp(search, "i") } },
                    { "event_location.state" : { '$regex' : new RegExp(search, "i") } },
                    { "event_location.pincode" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.full_name" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.mobile_no" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.email" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.flat_no" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.street" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.area" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.city" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.state" : { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.pincode" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.name" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.contact_no" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.email" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.about" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.flat_no" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.street" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.area" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.city" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.state" : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.pincode" : { '$regex' : new RegExp(search, "i") } },
                ],
                createdBy : mongoose.Types.ObjectId(req.token.organizerid)
            }).populate({ path: 'event_category', model: primary.model(constants.MODELS.eventcategories, categoryModel), select: "categoryname description event_type" }).select('name event_type event_category other timestamp status createdAt updatedAt about event_location banner accept_booking is_approved is_live').lean();
            let shops =  await primary.model(constants.MODELS.shops, shopModel).find({
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
            }).populate({path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description"}).lean();
            let offlineoffer =  await primary.model(constants.MODELS.offlineoffers, offlineofferModel).find({
                $or: [
                    { offer_title: { '$regex': new RegExp(search, "i") } },
                    { description: { '$regex': new RegExp(search, "i") } },
                    { start_date : { '$regex': new RegExp(search, "i") } },
                    { end_date : { '$regex': new RegExp(search, "i") } },
                    { tandc : { '$regex': new RegExp(search, "i") } }
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid),
            }).populate({path : 'shopid', model : primary.model(constants.MODELS.shops, shopModel), select : 'shop_name banner'}).lean();
            let onlineoffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).find({
                $or: [
                    { description: { '$regex': new RegExp(search, "i") } },
                    { shop_name: { '$regex': new RegExp(search, "i") }},
                    { start_date: { '$regex': new RegExp(search, "i") }},
                    { end_date: { '$regex': new RegExp(search, "i") }},
                    { product_name: { '$regex': new RegExp(search, "i") }},
                    { company_name: { '$regex': new RegExp(search, "i") }},
                    { company_contact_no: { '$regex': new RegExp(search, "i") }},
                    { company_email: { '$regex': new RegExp(search, "i") }},
                    { about_company: { '$regex': new RegExp(search, "i") }}
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid),
            }).populate({
                path : 'product_links.platform',
                model : primary.model(constants.MODELS.platforms, platformModel),
                select : 'name platformimage'
            }).lean();
            let livestreams = await primary.model(constants.MODELS.livestreams, livestreamModel).find({
                $or: [
                    { event_name : { '$regex' : new RegExp(search, "i") } },
                    { event_description : { '$regex' : new RegExp(search, "i") } },
                    { event_date : { '$regex' : new RegExp(search, "i") } },
                    { event_start_time : { '$regex' : new RegExp(search, "i") } },
                    { event_end_time : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.name" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.contact_no" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.email" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.flat_no" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.street" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.area" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.city" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.state" :  { '$regex' : new RegExp(search, "i") } },
                    { "companydetail.pincode" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.full_name" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.mobile_no" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.email" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.flat_no" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.street" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.area" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.city" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.state" :  { '$regex' : new RegExp(search, "i") } },
                    { "personaldetail.pincode" :  { '$regex' : new RegExp(search, "i") } }
                ],
                createdBy : mongoose.Types.ObjectId(req.token.organizerid)
            }).select('event_name event_category event_description event_date event_start_time event_end_time event_type price_per_user status photos').lean();
            return responseManager.onSuccess('Search list!', {events : events, shops : shops, offlineoffer : offlineoffer, onlineoffer : onlineoffer, livestreams : livestreams}, res);
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to search globally, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to search globally, please try again' }, res);
    }
});
