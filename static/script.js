let socket = io.connect(window.location.origin);
socket.emit("establish_relation");

let country_layers = {};
let target = "";
let disable = false;

let wrong_guesses = [];

let wipe = function(){};
let guess = function(){};

function new_country()
{
    socket.emit("new-country");

    document.getElementById("guess").textContent = "Guess";
    document.getElementById("guess").onclick = guess;

    let child = document.getElementById("start hints").lastChild;
    while (child)
    {
        document.getElementById("start hints").removeChild(child);
        child = document.getElementById("start hints").lastChild;
    }

    child = document.getElementById("middle hints").lastChild;
    while (child)
    {
        document.getElementById("middle hints").removeChild(child);
        child = document.getElementById("middle hints").lastChild;
    }

    child = document.getElementById("end hints").lastChild;
    while (child)
    {
        document.getElementById("end hints").removeChild(child);
        child = document.getElementById("end hints").lastChild;
    }

    socket.emit("get-hints", "start", function(response){
        let keys = Object.keys(response);

        for (let i = 0; i < keys.length; i++)
        {
            let hint = document.createElement("h4");
            hint.textContent = keys[i] + ": " + response[keys[i]];
            document.getElementById("start hints").appendChild(hint);
        }
    });

    document.getElementById("hidden1").style.display = "";
    document.getElementById("hidden2").style.display = "";

    for (v in country_layers)
    {
        target = v;
        wipe();
    }

    disable = false;
    wrong_guesses = [];

    const heartInterval = setInterval(() => {
        if (document.getElementById("hearts").children.length == 9) clearInterval(heartInterval);
        else
        {
            let image = document.createElement("img");
            image.src = "static/heart.webp";
            image.style.width = "2.5%";
            document.getElementById("hearts").appendChild(image);
        }
    }, 100);
}

guess = function()
{
    socket.emit("check-answer", function(answer){
        if (target == answer)
            {
                document.getElementById("country").textContent = "";
                document.getElementById("end").querySelector("h2").textContent = "Correct";
                document.getElementById("end").querySelector("h2").style.color = "green";
                document.getElementById("end").querySelector("h3").textContent = "The country was " + answer;
                document.getElementById("end").show();

                document.getElementById("guess").textContent = "New country";
                document.getElementById("guess").onclick = new_country
                disable = true;

                confetti({
                    particleCount: 1000,
                    spread: 150,
                    origin: { y: 0.6 },
                    zIndex: 1000
                });
            } else
            {
                country_layers[target].setStyle({
                    fillColor: '#de4d43',
                    fillOpacity: 0.5,
                });

                wrong_guesses.push(target);
        
                target = "";
                document.getElementById("country").textContent = "";

                socket.emit("lower-lives", function(lives){
                    if (lives == 0)
                    {
                        document.getElementById("end").querySelector("h2").textContent = "You Lost";
                        document.getElementById("end").querySelector("h2").style.color = "red";
                        document.getElementById("end").querySelector("h3").textContent = "The country was " + answer;
                        document.getElementById("end").show();
                        
                        document.getElementById("guess").textContent = "New country";
                        document.getElementById("guess").onclick = new_country
                        disable = true;

                        country_layers[answer].setStyle({
                            fillColor: '#5b64bd',
                            fillOpacity: 0.5
                        });
                    }

                    if (lives == 6){
                        socket.emit("get-hints", "middle", function(response){
                            let keys = Object.keys(response);

                            document.getElementById("hidden1").style.display = "none";
                    
                            for (let i = 0; i < keys.length; i++)
                            {
                                let hint = document.createElement("h4");
                                hint.textContent = keys[i] + ": " + response[keys[i]];
                                document.getElementById("middle hints").appendChild(hint);
                            }
                        });
                    }

                    if (lives == 3){
                        socket.emit("get-hints", "end", function(response){
                            let keys = Object.keys(response);

                            document.getElementById("hidden2").style.display = "none";
                    
                            for (let i = 0; i < keys.length; i++)
                            {
                                let hint = document.createElement("h4");
                                hint.textContent = keys[i] + ": " + response[keys[i]];
                                document.getElementById("end hints").appendChild(hint);
                            }
                        });
                    }
                    
                    document.getElementById("hearts").children[lives].remove();
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 800);
                });
            }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    for (let i = 0; i < 9; i++){
        let image = document.createElement("img");
        image.src = "static/heart.webp";
        image.style.width = "2.5%";
        document.getElementById("hearts").appendChild(image);
    };

    socket.emit("get-hints", "start", function(response){
        let keys = Object.keys(response);

        document.getElementById("hidden1").style.display = "";
        document.getElementById("hidden2").style.display = "";

        document.getElementById("hidden1").style.marginLeft = "6%";
        document.getElementById("hidden2").style.marginLeft = "10%";

        for (let i = 0; i < keys.length; i++)
        {
            let hint = document.createElement("h4");
            hint.textContent = keys[i] + ": " + response[keys[i]];
            document.getElementById("start hints").appendChild(hint);
        }
    });

    const key = 'MWTbW34b3bWSBpRT3for';
    const map = L.map('map', {doubleClickZoom: false, minZoom: 2, maxBounds: [[-90, -180], [90, 180]]}).setView([0, 0], 2);

    L.maptilerLayer({
        apiKey: key,
        style: "c9783694-1f02-44b0-9a3a-a061c5ffaede",  // MapTiler style ID
    }).addTo(map);

    function style() {
        return {
            fillColor: '#ffffff',
            weight: 1,
            opacity: 0,
            color: '#555555',
            fillOpacity: 0,
        };
    }

    wipe = function()
    {
        if (target != "") country_layers[target].setStyle({
            fillColor: '#ffffff',
            fillOpacity: 0
        });
    }

    function highlightCountry(e) {

        const layer = e.target;

        if (layer.feature.properties.ADMIN != target && !wrong_guesses.includes(layer.feature.properties.ADMIN) && disable == false){
            if (target != "") wipe();

            layer.setStyle({
                fillColor: '#34eb74',
                fillOpacity: 0.5,
            });

            target = layer.feature.properties.ADMIN;
        } else if (!wrong_guesses.includes(target) && disable == false) {
            wipe();

            target = "";
        }

        if (target != "" && disable == false) document.getElementById("country").textContent = target;
        else document.getElementById("country").textContent = ""
    }

    $.getJSON('static/countries.geojson', function(data) {
        geojson = L.geoJson(data, {
            style: style,
            onEachFeature: function (feature, layer) {
                country_layers[feature.properties.ADMIN] = layer;

                layer.on({
                    click: highlightCountry
                });
            }
        }).addTo(map);
    });

    document.getElementById("map").querySelector(".leaflet-control-container").remove();
    document.getElementById("map").querySelector("a").remove();
});