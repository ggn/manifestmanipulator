var crypto = require('crypto'),
    EXPIRY = process.env.EXPIRY || "600", //in seconds
    ALGO = process.env.ALGO || "sha256",
    SECRET = process.env.SECRET || "eiifcckjcnjkjfrufefdrein";


var getEpochTime = function (expiry_offset) {
    var currentTime = new Date(),
        currentTimeInMilliseconds = expiry_offset ? currentTime.getTime() + (expiry_offset * 1000) : currentTime.getTime();
    const utcMilllisecondsSinceEpoch = currentTimeInMilliseconds + (currentTime.getTimezoneOffset() * 60 * 1000);
    const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000);
    return utcSecondsSinceEpoch;
}

exports.handler = async (event, context) => {
    const defaut_headers = [], //["User-Agent", "Session-ID"]
        actual_headers = process.env.HEADERS,
        headers_to_validate = actual_headers ? JSON.parse(actual_headers) : defaut_headers;

    var data_to_hash = {
        st: getEpochTime(),
        exp: getEpochTime(EXPIRY)
    };


    for (var i = 0; i < headers_to_validate.length; i++) {
        var header = headers_to_validate[i];
        if (event.header[header])
            data_to_hash[header] = event.header[header];
    }

    console.dir(data_to_hash);
    const hmac = crypto.createHmac(ALGO, SECRET);
    hmac.update(JSON.stringify(data_to_hash));
    const hmac_token = hmac.digest('hex');

    return {
        "video_token": `?hdnts=st=${data_to_hash.st}~exp=${data_to_hash.exp}~hmac=${hmac_token}`,
        data: data_to_hash,
        headers: event.header
    };
}
