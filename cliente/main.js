var child;
var fails = 0;
var goBinary = "./cliente"; //or template.exe

function setPage(html) {
    const container = document.getElementById("app");
    app.innerHTML = html;
    //set focus for autofocus element
    var elem = document.querySelector("input[autofocus]");
    if (elem != null) {
        elem.focus();
    }

    try {
        $('#tabla').DataTable({
            "language": {
                "sProcessing": "Procesando...",
                "sLengthMenu": "Mostrar _MENU_ archivos",
                "sZeroRecords": "No se encontraron resultados",
                "sEmptyTable": "No tienes ficheros subidos",
                "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
                "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                "sInfoPostFix": "",
                "sSearch": "Buscar:",
                "sUrl": "",
                "sInfoThousands": ",",
                "sLoadingRecords": "Cargando...",
                "oPaginate": {
                    "sFirst": "Primero",
                    "sLast": "Último",
                    "sNext": "Siguiente",
                    "sPrevious": "Anterior"
                },
                "oAria": {
                    "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                    "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                }
            },
            "columnDefs": [{
                "type": 'file-size',
                "targets": "sizeColumn"
            }],
            "order": [[ 0, "asc" ]],
            "lengthMenu": [ [10, 25, -1], [10, 25, "Todos"] ]
        })
    } catch (err) {}

    try{
        $('#modalNormal').modal('show')
        $('#modalNormal').on('hidden.bs.modal', function () {
            $('#restart').click()
            $('#goLogin').click()
        })
    } catch(err){}

    try{
        $('#modalError').modal('show')
        $('#modalError').on('hidden.bs.modal', function () {
            $('#restart').click()
            $('#goLogin').click()
        })
    } catch(err){}
}

function body_message(msg) {
    setPage('<h1>' + msg + '</h1>');
}

function start_process() {
    body_message("Loading...");

    const spawn = require('child_process').spawn;
    child = spawn(goBinary, {
        maxBuffer: 1024 * 500
    });

    const readline = require('readline');
    const rl = readline.createInterface({
        input: child.stdout
    })

    rl.on('line', (data) => {
        console.log(`Received: ${data}`);
        setPage(data);
    });

    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        body_message(`process exited with code ${code}`);
        restart_process();
    });

    child.on('error', (err) => {
        body_message('Failed to start child process.');
        restart_process();
    });
}

function restart_process() {
    setTimeout(function () {
        fails++;
        if (fails > 5) {
            close();
        } else {
            start_process();
        }
    }, 5000);
}

function element_as_object(elem) {
    var obj = {
        properties: {}
    }
    for (var j = 0; j < elem.attributes.length; j++) {
        obj.properties[elem.attributes[j].name] = elem.attributes[j].value;
    }
    //overwrite attributes with properties
    if (elem.value != null) {
        obj.properties["value"] = elem.value.toString();
    }
    if (elem.checked != null && elem.checked) {
        obj.properties["checked"] = "true";
    } else {
        delete(obj.properties["checked"]);
    }
    return obj;
}

function element_by_tag_as_array(tag) {
    var items = [];
    var elems = document.getElementsByTagName(tag);
    for (var i = 0; i < elems.length; i++) {
        items.push(element_as_object(elems[i]));
    }
    return items;
}

function fire_event(name, sender) {
    var msg = {
        name: name,
        sender: element_as_object(sender),
        inputs: element_by_tag_as_array("input").concat(element_by_tag_as_array("select"))
    }
    child.stdin.write(JSON.stringify(msg));
    console.log(JSON.stringify(msg));
}

function fire_keypressed_event(e, keycode, name, sender) {
    if (e.keyCode === keycode) {
        e.preventDefault();
        fire_event(name, sender);
    }
}

function avoid_reload() {
    if (sessionStorage.getItem("loaded") == "true") {
        alert("go-webkit will fail when page reload. avoid using <form> or submit.");
        close();
    }
    sessionStorage.setItem("loaded", "true");
}

avoid_reload();
start_process();
require('nw.gui').Window.get().maximize();
//require('nw.gui').Window.get().showDevTools()
