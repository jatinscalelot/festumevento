const shopModel = require('../../../models/shops.model');
const organizerModel = require('../../../models/organizers.model');
const shopcategoryModel = require('../../../models/shopcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
function validateLatLng(lat, lng) {
    let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
    return pattern.test(lat) && pattern.test(lng);
};
exports.save = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid, banner, shop_name, shop_category, shop_days, start_date, end_date, about_shop, flat_no, street_name, area_name, city, state, pincode, longitude, latitude, company_name, gst_file, contact_number, emailid, about, social_media_links, status } = req.body;
            if (banner && shop_name && shop_category && shop_days && start_date && end_date && city && state && pincode && longitude && latitude) {
                if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                    if (latitude && latitude != '' && longitude && longitude != '' && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
                        let obj = {
                            banner: banner,
                            shop_name: shop_name,
                            shop_category: mongoose.Types.ObjectId(shop_category),
                            shop_days: shop_days,
                            start_date: start_date,
                            end_date: end_date,
                            about_shop: about_shop,
                            flat_no: flat_no,
                            street_name: street_name,
                            area_name: area_name,
                            city: city,
                            state: state,
                            pincode: pincode,
                            companydetails : {
                                company_name: company_name,
                                gst_file: gst_file,
                                contact_number: contact_number,
                                emailid: emailid,
                                about: about,
                                social_media_links: social_media_links
                            },
                            location: { type: "Point", coordinates: [longitude, latitude] },
                            updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                            status : (status == false) ? status : true
                        };
                        await primary.model(constants.MODELS.shops, shopModel).findByIdAndUpdate(shopid, obj);
                        let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).populate({ path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description" }).lean();
                        if (shopData && shopData != null) {
                            return responseManager.onSuccess('Shop updated successfully!', shopData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid shop id to update Shop, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid Lat-Long to update Shop, please try again' }, res);
                    }
                } else {
                    if (latitude && latitude != '' && longitude && longitude != '' && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
                        let obj = {
                            banner: banner,
                            shop_name: shop_name,
                            shop_category: mongoose.Types.ObjectId(shop_category),
                            shop_days: shop_days,
                            start_date: start_date,
                            end_date: end_date,
                            about_shop: about_shop,
                            flat_no: flat_no,
                            street_name: street_name,
                            area_name: area_name,
                            city: city,
                            state: state,
                            pincode: pincode,
                            companydetails : {
                                company_name: company_name,
                                gst_file: gst_file,
                                contact_number: contact_number,
                                emailid: emailid,
                                about: about,
                                social_media_links: social_media_links
                            },
                            location: { type: "Point", coordinates: [longitude, latitude] },
                            createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                            updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                            status : (status == false) ? status : true
                        };
                        let createdShop = await primary.model(constants.MODELS.shops, shopModel).create(obj);
                        let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(createdShop._id).populate({ path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description" }).lean();
                        if (shopData && shopData != null) {
                            return responseManager.onSuccess('Shop created successfully!', shopData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid shop data to create Shop, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid Lat-Long to create Shop, please try again' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'All fields are mandatory to update or create Shop, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get Shop list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};