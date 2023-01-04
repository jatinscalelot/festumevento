const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const onlineofferModel = require('../../../../models/onlineoffers.model');
const platformModel = require('../../../../models/platforms.model');
const onlineofferreviewModel = require('../../../../models/onlineofferreviews.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { page, limit, search, platform } = req.body;
            let query = {};
            if(platform && platform != '' && mongoose.Types.ObjectId.isValid(platform)){
                query = {
                    "product_links.platform" : mongoose.Types.ObjectId(platform)
                };
            }
            primary.model(constants.MODELS.onlineoffers, onlineofferModel).paginate({
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
                ...query
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                populate: {
                    path : 'product_links.platform',
                    model : primary.model(constants.MODELS.platforms, platformModel),
                    select : 'name platformimage'
                },
                lean: true
            }).then((onlineoffers) => {
                let alloffers = [];
                async.forEachSeries(onlineoffers.docs, (offer, next_offer) => {
                  (async () => {
                    let noofreview = parseInt(await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).countDocuments({ offerid: mongoose.Types.ObjectId(offer._id) }));
                    if (noofreview > 0) {
                      let totalReviewsCountObj = await primary.model(constants.MODELS.onlineofferreviews, onlineofferreviewModel).aggregate([{ $match: { offerid: mongoose.Types.ObjectId(offer._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                      if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                        offer.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                        offer.totalreviews = noofreview;
                        alloffers.push(offer);
                      }
                    } else {
                      offer.ratings = '0.0';
                      offer.totalreviews = 0;
                      alloffers.push(offer);
                    }
                    next_offer();
                  })().catch((error) => { });
                }, () => {
                    onlineoffers.docs = alloffers;
                    return responseManager.onSuccess("online offer List", onlineoffers, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to get online offer list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};