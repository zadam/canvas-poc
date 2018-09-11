jsPlumb.ready(function () {
    const instance = jsPlumb.getInstance({
        Endpoint: ["Dot", {radius: 2}],
        Connector: "StateMachine",
        HoverPaintStyle: {stroke: "#1e8151", strokeWidth: 2 },
        ConnectionOverlays: [
            [ "Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8
            } ],
            [ "Label", { label: "", id: "label", cssClass: "aLabel" }]
        ],
        Container: "canvas"
    });

    instance.registerConnectionType("basic", { anchor:"Continuous", connector:"StateMachine" });

    window.jsp = instance;

    const canvas = document.getElementById("canvas");

    instance.bind("click", function (c) {
        const type = prompt("Specify new connection type:");

        c.getOverlay("label").setLabel(type);

        const relation = data.relations.find(relation => relation.connectionId === c.id);
        relation.type = type;
    });

    let data;
    let initDone = false;

    instance.bind("connection", function (info) {
        const connection = info.connection;
        let type;

        if (initDone) {
            type = prompt("Specify new connection label:");

            data.relations.push({
                connectionId: connection.id,
                source: connection.sourceId,
                target: connection.targetId,
                type: type
            });

            saveData();
        }
        else {
            type = "none";
        }

        connection.getOverlay("label").setLabel(type);
    });

    jsPlumb.on(canvas, "dblclick", function(e) {
        newNode(jsPlumbUtil.uuid(),"new", e.offsetX, e.offsetY, "auto", "auto");
    });

    function saveData() {
        localStorage.setItem('triliumData', JSON.stringify(data));
    }

    function initNode(el) {
        instance.draggable(el, {
            handle: ".handle",
            start:function(params) {
            },
            drag:function(params) {

            },
            stop:function(params) {
                const note = data.notes.find(note => note.id === params.el.id);

                if (!note) {
                    console.error(`Note ${params.el.id} not found!`);
                    return;
                }

                [note.x, note.y] = params.finalPos;

                saveData();
            }
        });

        instance.makeSource(el, {
            filter: ".endpoint",
            anchor: "Continuous",
            connectorStyle: { stroke: "#5c96bc", strokeWidth: 2, outlineStroke: "transparent", outlineWidth: 4 },
            connectionType:"basic",
            extract:{
                "action":"the-action"
            }
        });

        instance.makeTarget(el, {
            dropOptions: { hoverClass: "dragHover" },
            anchor: "Continuous",
            allowLoopback: true
        });

        // this is not part of the core demo functionality; it is a means for the Toolkit edition's wrapped
        // version of this demo to find out about new nodes being added.
        //
        instance.fire("jsPlumbDemoNodeAdded", el);

        $(el).resizable({
            resize: function(event, ui) {
//                instance.repaint(ui.helper.prop("id"));

                instance.repaintEverything();
            },
            stop: function(event, ui) {
                const note = data.notes.find(note => note.id === ui.helper.prop("id"));

                note.width = ui.helper.width();
                note.height = ui.helper.height();

                saveData();
            },
            handles: "all"
        });
    }

    function newNode(id, title, x, y, width, height) {
        const $noteBox = $("<div>")
            .addClass("note-box")
            .prop("id", id)
            .append($("<div>").addClass("handle"))
            .append($("<span>").text(title))
            .append($("<div>").addClass("endpoint"))
            .css("left", x + "px")
            .css("top", y + "px")
            .css("width", width)
            .css("height", height);

        instance.getContainer().appendChild($noteBox[0]);

        initNode($noteBox[0]);
    }

    const notes = [
        { id: "eliI", title: "Queen Elizabeth", x: 100, y: 100 },
        { id: "kinggeorge", title: "King George VI.", x: 300, y: 100 },
        { id: "phillip", title: "Prince Phillip" },
        { id: "eliII", title: "Queen Elizabeth II.", x: 300, y: 300 },
        { id: "charles", title: "Prince Charles" },
        { id: "diana", title: "Princess Diana" },
        { id: "harry", title: "Prince Harry" },
        { id: "william", title: "Prince William "}
    ];

    const relations = [
        { source: "eliI", target: "kinggeorge", type: "isSpouse" },
        { source: "eliI", target: "eliII", type: "hasChild" },
        { source: "kinggeorge", target: "eliII", type: "hasChild" },
        { source: "eliII", target: "charles", type: "hasChild" },
        { source: "phillip", target: "charles", type: "hasChild" },
        { source: "phillip", target: "eliII", type: "isSpouse" },
        { source: "charles", target: "diana", type: "isSpouse" },
        { source: "charles", target: "william", type: "hasChild" },
        { source: "charles", target: "harry", type: "hasChild" },
        { source: "diana", target: "william", type: "hasChild" },
        { source: "diana", target: "harry", type: "hasChild" }
    ];

    data = localStorage.getItem('triliumData');

    if (data) {
        data = JSON.parse(data);
    }
    else {
        data = { notes, relations };

        saveData();
    }

    // suspend drawing and initialise.
    instance.batch(function () {
        const maxY = notes.filter(note => !!note.y).map(note => note.y).reduce((a, b) => Math.max(a, b));
        let curX = 100;
        let curY = maxY + 200;

        for (const note of data.notes) {
            if (note.x && note.y) {
                newNode(note.id, note.title, note.x, note.y, note.width + "px", note.height + "px");
            }
            else {
                note.width = "auto";
                note.height = "auto";

                newNode(note.id, note.title, curX, curY, note.width, note.height);

                if (curX > 1000) {
                    curX = 100;
                    curY += 200;
                }
                else {
                    curX += 200;
                }
            }
        }

        for (const relation of data.relations) {
            const connection = instance.connect({ id: relation.id, source: relation.source, target: relation.target, type:"basic" });

            relation.connectionId = connection.id;

            connection.getOverlay("label").setLabel(relation.type);
        }

        initDone = true;
    });

    jsPlumb.fire("jsPlumbDemoLoaded", instance);
});
