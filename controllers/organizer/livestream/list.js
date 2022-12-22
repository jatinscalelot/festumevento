const organizerModel = require('../../../models/organizers.model');
const livestreamModel = require('../../../models/livestreams.model');
const categoryModel = require('../../../models/eventcategories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            await primary.model(constants.MODELS.livestreams, livestreamModel).paginate({
                $or: [
                    { event_name : { '$regex' : new RegExp(search, "i") } },
                    { event_description : { '$regex' : new RegExp(search, "i") } },
                    { event_date : { '$regex' : new RegExp(search, "i") } },
                    { event_start_time : { '$regex' : new RegExp(search, "i") } },
                    { event_end_time : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } }
                ],
                createdBy : mongoose.Types.ObjectId(req.token.organizerid)
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                populate:  { path: 'event_category', model: primary.model(constants.MODELS.eventcategories, categoryModel), select: "categoryname description event_type" },
                select: 'event_name event_category event_description event_date event_start_time event_end_time event_type price_per_user status photos',
                lean: true
            }).then((livestreame) => {
                return responseManager.onSuccess('Events Live Stream list!', livestreame, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event live streaming list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event live streaming list, please try again' }, res);
    }
};