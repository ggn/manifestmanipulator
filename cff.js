var crypto = require('crypto'),
    ALGO = "sha256", //Same algo used to compute HMAC
    SECRET = "eiifcckjcnjkjfrufefdrein"; //Same secret used to compute HMAC

var sendresponse = function (msg) {
    var response = {
        statusCode: 401,
        statusDescription: msg,
        headers: {
            'cloudfront-functions': {
                value: msg
            }
        },
    };
    return response;
}

var getEpochUTCTime = function () {
    var currentTime = new Date(),
        currentTimeInMilliseconds = currentTime.getTime();
    var utcMilllisecondsSinceEpoch = currentTimeInMilliseconds + (currentTime.getTimezoneOffset() * 60 * 1000);
    var utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000);
    return utcSecondsSinceEpoch;
}

function handler(event) {

    var request = event.request,
        headers = request.headers,
        token = request.querystring.hdnts;

    if (token)
        token = token.value
    else
        return sendresponse("Missing Security Token");

    console.log(headers);
    console.log(token);

    var auth_vars = token ? token.split("~") : null,
        headers_to_validate = []; //["user-agent"]; //Ensure headers are same as the headers used to compute HMAC


    if (!auth_vars || auth_vars == null || auth_vars.length <= 0)
        return sendresponse("Missing Security Token");

    var hmac_obj = {};
    auth_vars.forEach(function (x) {
        var t = x.split("=");
        hmac_obj[t[0]] = t[1]
    });

    console.log("HMAC OBJ")
    console.log(hmac_obj);

    if (!hmac_obj.st || !hmac_obj.exp || !hmac_obj.hmac) {
        return sendresponse("Invalid Security Token");
    }

    var currentEpochTime = getEpochUTCTime();
    if (currentEpochTime < hmac_obj.st)
        return sendresponse("Invalid Issue Time in Security Token.");

    if (currentEpochTime > hmac_obj.exp)
        return sendresponse("Security Token Expired.");

    var data_to_hash = {
        st: parseInt(hmac_obj.st),
        exp: parseInt(hmac_obj.exp)
    };
    for (var i = 0; i < headers_to_validate.length; i++) {
        var header = headers_to_validate[i],
            header_obj = headers[header] ? headers[header][0][0] : null;
        if (header_obj && header_obj != null)
            data_to_hash[header_obj.key] = header_obj.value;
    }

    console.log(data_to_hash);
    var hmac = crypto.createHmac(ALGO, SECRET);
    hmac.update(JSON.stringify(data_to_hash));
    var hmac_token = hmac.digest('hex');
    console.log(hmac_token);
    if (hmac_token != hmac_obj.hmac)
        return sendresponse("Invalid HMAC Token.");

    return request;
}
