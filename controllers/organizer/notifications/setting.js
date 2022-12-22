const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const settingModel = require('../../../models/settings.model');
const mongoose = require('mongoose');
exports.getsettings = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
            if (defaultSetting && defaultSetting.length > 0) {
                return responseManager.onSuccess('Promotion schedule set successfully', defaultSetting, res);
            } else {
                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get settings data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};