var socket;
var table;

(function() {
    socket = new WebSocket("ws://" + window.location.host + "/websocket");
    table = $("#table");

    socket.addEventListener("message", function(e) {
        const data = JSON.parse(e.data);
        const msg = data.value;
        table.append(msg);
    });
})()

function send() {
    const username = "teste 1";
    const value = "123";

    socket.send(
        JSON.stringify({
            username,
            value
        })
    )
}