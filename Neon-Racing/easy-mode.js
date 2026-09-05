(function () {
  "use strict";
  var nativeFrame = window.requestAnimationFrame.bind(window);
  var firstReal = null;
  var firstGame = null;
  window.requestAnimationFrame = function (callback) {
    return nativeFrame(function (realTime) {
      if (firstReal === null) {
        firstReal = realTime;
        firstGame = realTime;
      }
      callback(firstGame + (realTime - firstReal) * 0.78);
    });
  };
})();
