const mongoConnection = require('../../../../utilities/connections');
const responseManager = require('../../../../utilities/response.manager');
const constants = require('../../../../utilities/constants');
const organizerModel = require('../../../../models/organizers.model');
const offlineofferModel = require('../../../../models/offlineoffers.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { shopid, page, limit, search } = req.body;
            if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                primary.model(constants.MODELS.offlineoffers, offlineofferModel).paginate({
                    $or: [
                        { offer_title: { '$regex': new RegExp(search, "i") } },
                        { description: { '$regex': new RegExp(search, "i") } }
                    ],
                    createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                    shopid: mongoose.Types.ObjectId(shopid)
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id: -1 },
                    lean: true
                }).then((offlineoffers) => {
                    return responseManager.onSuccess('Offline Offers list!', offlineoffers, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid shop id to get offline offer list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to get offline offer list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};