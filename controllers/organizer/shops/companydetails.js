const shopModel = require('../../../models/shops.model');
const organizerModel = require('../../../models/organizers.model');
const shopcategoryModel = require('../../../models/shopcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.companydetails = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid, company_name, gst_file, contact_number, emailid, about, social_media_links } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                let obj = {
                    company_name: company_name,
                    gst_file: gst_file,
                    contact_number: contact_number,
                    emailid: emailid,
                    about: about,
                    social_media_links: social_media_links
                };
                await primary.model(constants.MODELS.shops, shopModel).findByIdAndUpdate(shopid, { companydetails: obj });
                let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).populate({ path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description" }).lean();
                if (shopData && shopData != null) {
                    return responseManager.onSuccess('Shop updated successfully!', shopData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid shop id to update Shop, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid shopid to update Shop data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update Shop data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};

