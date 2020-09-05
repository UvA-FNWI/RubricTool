if (window.location.pathname.indexOf('/rubrics/') != -1) {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "https://content.datanose.nl/rubrictool.js";
    $("head").append(s);
}