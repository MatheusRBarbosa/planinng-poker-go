var socket;
var table;
var activeValue = null;

(function() {
    socket = new WebSocket("ws://" + window.location.host + "/websocket");
    table = $("#result");

    socket.addEventListener("message", function(e) {
        const data = JSON.parse(e.data);
        const msg = data.value;
        table.append(msg);
    });
})()

function clickCard(value) {
    if(value != activeValue) {
        $(`#c${activeValue}`).removeClass('active');
        $(`#c${value}`).addClass('active');
        activeValue = value;
        _sendEvent('ClickCard', value);
    }
}

function _sendEvent(event, value) {
    const username = "teste 1";
    console.log("enviando >> ", value)
    socket.send(
        JSON.stringify({
            username,
            value,
            event
        })
    )
}