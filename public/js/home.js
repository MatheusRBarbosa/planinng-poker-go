(function() {
    _checkUsername()
    _checkSessionId()
})()

function submitAuth(e) {
    e.preventDefault();

    const username = $('#username').val();
    let sessionId = $('#session').val();

    _setUsername(username);

    if(!sessionId) {
        sessionId = _generateSessionId(32);
    }

    window.location.href = `play.html?s=${sessionId}`;
}

function _checkUsername() {
    const username = localStorage.getItem("username");
    if(username) {
        $('#username').val(username);
    }
}

function _checkSessionId() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.has('s') ? urlParams.get('s') : null;

    if(sessionId) {
        $('#session').val(sessionId);
    }
}

function _setUsername(username) {
    localStorage.setItem("username", username);
}

function _generateSessionId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
