const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const onlineofferModel = require('../../../../models/onlineoffers.model');
const platformModel = require('../../../../models/platforms.model');
const mongoose = require('mongoose');
const async = require('async');
exports.save = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { offerid, shop_name, offer_amount, offer_type, start_date, end_date, product_name, poster, images, description, status, product_links, company_name, company_gst, company_contact_no, company_email, about_company, tandc } = req.body;
            if(product_links && product_links.length > 0){
                let finalproduct_links = [];
                async.forEachSeries(product_links, (product_link, next_product_link) => {
                    if(product_link.platform && product_link.platform != '' && mongoose.Types.ObjectId.isValid(product_link.platform)){
                        product_link.platform = mongoose.Types.ObjectId(product_link.platform);
                        finalproduct_links.push(product_link);
                    }
                    next_product_link();
                }, () => {
                    ( async () => {
                        if (offerid && offerid && mongoose.Types.ObjectId.isValid(offerid)) {
                            var obj = {
                                shop_name: shop_name,
                                offer_amount: offer_amount,
                                offer_type: offer_type,
                                start_date: start_date,
                                end_date: end_date,
                                product_name: product_name,
                                poster: poster,
                                images: images,
                                description: description,
                                status: status,
                                product_links: finalproduct_links,
                                company_name: company_name,
                                company_gst: company_gst,
                                company_contact_no: company_contact_no,
                                company_email: company_email,
                                about_company: about_company,
                                tandc: tandc,
                                updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findByIdAndUpdate(offerid, obj);
                            let onlineOffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(offerid).populate({
                                path : 'product_links.platform',
                                model : primary.model(constants.MODELS.platforms, platformModel),
                                select : 'name platformimage'
                            }).lean();
                            return responseManager.onSuccess('Online offer updated successfully!', onlineOffer, res);
                        } else {
                            var obj = {
                                shop_name: shop_name,
                                offer_amount: offer_amount,
                                offer_type: offer_type,
                                start_date: start_date,
                                end_date: end_date,
                                product_name: product_name,
                                poster: poster,
                                images: images,
                                description: description,
                                status: status,
                                product_links: finalproduct_links,
                                company_name: company_name,
                                company_gst: company_gst,
                                company_contact_no: company_contact_no,
                                company_email: company_email,
                                about_company: about_company,
                                tandc: tandc,
                                createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                                updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            let createdOnlineOffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).create(obj);
                            let onlineOffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(createdOnlineOffer._id).populate({
                                path : 'product_links.platform',
                                model : primary.model(constants.MODELS.platforms, platformModel),
                                select : 'name platformimage'
                            }).lean();
                            return responseManager.onSuccess('Online offer created successfully!', onlineOffer, res);
                        }
                    })().catch((error) => {
                        return responseManager.onError(error, res);
                    });
                });
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to save online offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};