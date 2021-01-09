(function (global) {

  // Set up a namespace for our utility
  var ajaxUtils = {};


  // Returns an HTTP request object
  function getRequestObject() {
    if (global.XMLHttpRequest) {
      return (new XMLHttpRequest());
    }
    else if (global.ActiveXObject) {
      // For very old IE browsers (optional)
      return (new ActiveXObject("Microsoft.XMLHTTP"));
    }
    else {
      global.alert("Ajax is not supported!");
      return(null);
    }
  }


  // Makes an Ajax GET request to 'requestUrl'
  ajaxUtils.sendGetRequest =
    function(requestUrl, responseHandler, isJsonResponse) {
      var request = getRequestObject();
      request.onreadystatechange =
        function() {
          handleResponse(request,
                        responseHandler,
                        isJsonResponse);
        };
      request.open("GET", requestUrl, true);
      request.send(null); // for POST only
    };


  // Only calls user provided 'responseHandler'
  // function if response is ready
  // and not an error
  function handleResponse(request,
                          responseHandler,
                          isJsonResponse) {
    if ((request.readyState == 4) &&
      (request.status == 200)) {

      // Default to isJsonResponse = true
      if (isJsonResponse == undefined) {
        isJsonResponse = true;
      }

      if (isJsonResponse) {
        responseHandler(JSON.parse(request.responseText));
      }
      else {
        responseHandler(request.responseText);
      }
    }
  }

  // ADDITION: AJAX CALL WITH PROMISE RETURN
  // see: https://medium.com/front-end-weekly/ajax-async-callback-promise-e98f8074ebd7
  ajaxUtils.makeAjaxCall = function (url, methodType, isJsonResponse){
    var promiseObj = new Promise(function(resolve, reject){
      var xhr = new XMLHttpRequest();
      xhr.open(methodType, url, true);
      xhr.send();
      xhr.onreadystatechange = function(){
        if (xhr.readyState === 4){
          if (xhr.status === 200){
            //console.log("xhr done successfully");
            var resp = xhr.responseText;
            if (isJsonResponse) {
              var respJson = JSON.parse(resp);
              resolve(respJson);
            }
            else {
              resolve(resp);
            }
          } else {
            reject(xhr.status);
            //console.log("xhr failed");
          }
        } else {
          //console.log("xhr processing going on");
        }
      }
      //console.log("request sent succesfully");
    });
    return promiseObj;
  }

  // Console log with error status in case the ajax call does not succed
  ajaxUtils.errorHandler = function (statusCode){
    console.log("failed with Error status", statusCode);
  }

  // Expose utility to the global object
  global.ajaxUtils = ajaxUtils;

})(window);

