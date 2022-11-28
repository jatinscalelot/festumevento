const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const offlineofferModel = require('../../../../models/offlineoffers.model');
const mongoose = require('mongoose');
exports.save = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid, offerid, offer_title, start_date, end_date, poster, video, description, status, offer_on_all_products, all_product_images, all_product_conditions, offer_type, offer_type_conditions, tandc } = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)){
                if(offer_on_all_products && offer_on_all_products == true){
                    if(all_product_images && all_product_images.length > 0 && all_product_conditions && all_product_conditions.length > 0){
                        if(offerid && offerid && mongoose.Types.ObjectId.isValid(offerid)){
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : all_product_images,
                                all_product_conditions : all_product_conditions,
                                offer_type : '',
                                offer_type_conditions : [],
                                status : status,
                                tandc : tandc,
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findByIdAndUpdate(offerid, obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offerid).lean();
                            return responseManager.onSuccess('Offline offer updated successfully!', offlineOffer, res);
                        }else{
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : all_product_images,
                                all_product_conditions : all_product_conditions,
                                offer_type : '',
                                offer_type_conditions : [],
                                tandc : tandc,
                                status : status,
                                shopid : mongoose.Types.ObjectId(shopid),
                                createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            let createdOfflineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).create(obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(createdOfflineOffer._id).lean();
                            return responseManager.onSuccess('Offline offer created successfully!', offlineOffer, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid product conditions to create offer, product images and product conditions can not be empty, please try again' }, res);
                    }
                }else{
                    if(offer_type && (offer_type == 'limited_person' || offer_type == 'unlimited_person') && offer_type_conditions && offer_type_conditions.length > 0){
                        if(offerid && offerid && mongoose.Types.ObjectId.isValid(offerid)){
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : [],
                                all_product_conditions : [],
                                offer_type : offer_type,
                                offer_type_conditions : offer_type_conditions,
                                status : status,
                                tandc : tandc,
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findByIdAndUpdate(offerid, obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offerid).lean();
                            return responseManager.onSuccess('Offline offer updated successfully!', offlineOffer, res);
                        }else{
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : [],
                                all_product_conditions : [],
                                offer_type : offer_type,
                                offer_type_conditions : offer_type_conditions,
                                tandc : tandc,
                                status : status,
                                shopid : mongoose.Types.ObjectId(shopid),
                                createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            let createdOfflineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).create(obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(createdOfflineOffer._id).lean();
                            return responseManager.onSuccess('Offline offer created successfully!', offlineOffer, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid product conditions to create offer, offer type must be limited or unlimited person only and offer conditions can not be empty, please try again' }, res);
                    }
                }   
            }else{
                return responseManager.badrequest({ message: 'Invalid shop id to save offline offer data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to save offline offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};