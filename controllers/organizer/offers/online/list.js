const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const onlineofferModel = require('../../../../models/onlineoffers.model');
const platformModel = require('../../../../models/platforms.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { page, limit, search, platform } = req.body;
            let query = {};
            if(platform && platform != '' && mongoose.Types.ObjectId.isValid(platform)){
                query = {
                    "product_links.platform" : mongoose.Types.ObjectId(platform)
                };
            }
            primary.model(constants.MODELS.onlineoffers, onlineofferModel).paginate({
                $or: [
                    { offer_title: { '$regex': new RegExp(search, "i") } },
                    { description: { '$regex': new RegExp(search, "i") } }
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
                return responseManager.onSuccess('Online Offers list!', onlineoffers, res);
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