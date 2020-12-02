// ==UserScript==
// @name         subsBT
// @author       Hel
// @version      1.2.0
// @description  Adds subtitles to berrytube
// @match        http://berrytube.tv/*
// @match        http://www.berrytube.tv/*
// @match        https://berrytube.tv/*
// @match        https://www.berrytube.tv/*
// @match        https://berrytube.berrypun.ch:8445/*
// @match        http://btc.berrytube.tv:8000/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @grant        GM_addStyle
// @grant        GM_log
// ==/UserScript==

        $(".active .title").text("HMx01");

        // friendshipGames2             - NOT FINISHED

        // video id ="videowrap"
        // video id ="ytapiplayer"      - same but position relative

        // $(".volatile.active .title")             - title of playing now
        // $(".volatile.active .time")              - videoLength of playing now

        // https://jsonbin.io/          - uploaded by me subs                                   // login with Github

        (function(){

            let time = 0, part2AddedTime = 0, subsMovement = 0;
            let subsBase, nextPos, start, end, subs, subsInterval, epName;
            let subsRunning = false, nextPaused = true, menuHidden = false;
            const specials = ["HMx01", "forgotten-tc", "forgotten-fc", "LOEx01", "Friendship games - NOT finished"];
            const icons = {
                delete: "https://img.icons8.com/ultraviolet/80/000000/delete-sign.png",
                play: "https://img.icons8.com/fluent/48/000000/circled-play.png",
                stop: "https://img.icons8.com/fluent/48/000000/circled-pause.png",
                upload: "https://img.icons8.com/officel/16/000000/upload-2.png",
                arrowLeft: "https://img.icons8.com/offices/30/000000/back.png",
                plus: "https://img.icons8.com/offices/30/000000/plus-math.png",
                minus: "https://img.icons8.com/offices/30/000000/minus-math.png"
            }
    
            let oldTimings;
            if(window.localStorage.subsTimings)
                oldTimings = JSON.parse(window.localStorage.subsTimings);
            else
                oldTimings = {};
            
        console.log("OLD - timings: " + oldTimings);
    
            $(function(){
                // Test *******************************************************************
                $(document).on("keydown", function(e){
                    if(e.keyCode == 27){
                        PLAYER.getTime(function(playerTime){
                            time = playerTime *1000;
                            console.log(time);
                        });
                    }
                });
    
                // Init
                $("#videowrap").append("<div id=subs></div>");
                $("body").append(`
                    <div id=subsmenuwrapper>
                        <button class="subsbutton" id=subsstart><!--
                            --><div id=subsdisabledbutton><img style="width:17px;padding:2px" src="https://img.icons8.com/ultraviolet/48/000000/cancel-2.png"/></div><!--
                            --><div id=subsplaybutton style='display:block;top:0'><img style="width:21px" src="${icons.play}"/></div><!--
                            --><div id=subsstopbutton style='display:none;top:0'><img style="width:21px" src="${icons.stop}"/></div><!--
                        --></button><!--
                        --><button class="subsbutton" id=subsplus><img style="width:12px;" src="${icons.plus}"/></button><!--
                        --><button class="subsbutton" id=subsminus><img style="width:12px;" src="${icons.minus}"/></button><!--
                        --><div id=subsmove>0</div><!--
                        --><label class="subsbutton" for="subsfile" id=subsupload><img style="width:18px;" id=iconupload title="upload subs (.srt)" src="${icons.upload}"><img style="width:18px;padding-top:3px;display:none;" id=iconremoveupload title="Remove subs" src="${icons.delete}"></label><!--
                        --><input type=file accept=".srt" id=subsfile><!--
                        --><button class="subsbutton" id=subshide><img style="width:12px;" src="${icons.arrowLeft}"/></button>
                        <div id=subsspinner style="padding:2px 0px 0 2px;display:none;float:left;">
                            <svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="21px" height="21px" viewBox="0 0 50 50" style="enable-background:new 00 00 50 50;" xml:space="preserve">
                                <path style="fill:#118edc;" fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
                                    <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/>
                                </path>
                            </svg>
                        </div>
                        <div id=subserror>Not found!</div>
                    </div>`);
    
                $("#chatbuffer").css({fontSize:"125%"});
                let moveMail = setInterval(() => {
                    if($("#mailDiv").length){
                        $("#mailDiv").css({left: "180px"});
                        clearInterval(moveMail);
                    }
                }, 1000);
                $("#subsplus").on("click", () => {
                    time += 200;
                    subsMovement += 200;
                    $("#subsmove").text(subsMovement);
                });
                $("#subsminus").on("click", () => {
                    time -= 200;
                    subsMovement -= 200;
                    $("#subsmove").text(subsMovement);
                });
                $("#subsfile").on("change", function(){
                    $("#subsfile").attr("disabled", true);
                    readUploadedSubs("subsfile");
                    $("#iconupload").css({display: "none"}).siblings().css({display: "block"});
                });
                $("#subsupload").on("click", function(){
                    if($("#subsfile").attr("disabled")){
                        $("#iconremoveupload").css({display: "none"}).siblings().css({display: "block"});
                        stopSubs(false);
                        uploadedSubs = null;
                        $("#subsfile").attr("disabled", false);
                        return false;
                    }
                });
    
                // Hide mini-menu
                $("#subshide").on("click", () => {
                    if(menuHidden){
                        $("#subsmenuwrapper").css({"transform":"translateX(0)"});
                        setTimeout(() => {
                            $("#subshide").css({"transform":"scaleX(1)"});
                            $("#subshide").css({"border-radius":"0 0 4px 0"});
                        }, 700);
                        menuHidden = false;
                    } else {
                        $("#subsmenuwrapper").css({"transform":"translateX(calc(14px - 100%))"});
                        setTimeout(() => {
                            $("#subshide").css({"transform":"scaleX(-1)"});
                            $("#subshide").css({"border-radius":"0 0 0 4px"});
                        }, 700);
                        menuHidden = true;
                    }
                });
                // Init end
    
                // Start subs button
                $("#subsstart").on("click", () => {
                    if($("#subsdisabledbutton").css("display") == "block"){
                        console.log("disabled");
                        return;
                    }
                    if(subsRunning){                    // End subs
                        stopSubs();
                    } else {                            // Start subs
                        epName = $(".active .title").text().toLowerCase();
                        $("#subsspinner").fadeIn();
                        $("#subsdisabledbutton").css({display:"block"}).siblings().css({display:"none"});
                        $("#subs").html("");
                        // Special subs                      - Horse movie, forgotten friendship, legend of everfree, friendship games
                        if(specials.filter(subs => subs.toLowerCase() == epName.replace(/2$/,"1")).length){
                            let url;
                            switch(epName){
                                //horse movie
                                case "hmx01":
                                    url = "https://api.jsonbin.io/b/5efaf2b70bab551d2b6936ad/1";
                                    break;
                                //friendship games
                                case "fg": case "fg":                                           //*******************NOT finished********************************************************************************
                                    url = "https://api.jsonbin.io/b/5efb17ca0bab551d2b6945b1";
                                    break;
                                //forgotten friendship
                                case "forgotten-tc": case "forgotten-fc":
                                    url = "https://api.jsonbin.io/b/5efb1940bb5fbb1d25616984";
                                    break;
                                //legends of everyfree
                                case "loex01":
                                    url = "https://api.jsonbin.io/b/5efb1a4f7f16b71d48a88f22";
                                    break;
                            }
                            $.getJSON(url, function(result, status){
                                if(status != "success"){
                                    console.log("I just dont know what went wrong");
                                    GM_log("GM_log: I just dont know what went wrong");
                                    return;
                                }
                                startSubs(result.subs);
                            });
                        } else {
                        // Download subs from yayponies      - all eps + EQ1/2
                            let temp, subsName;
                            if(epName.match(/RRx0[12]/i)){
                                epName = "EQG2";
                            } else if(epName.match(/EQGx0[12]/i)){
                                epName = "EQG1";
                            } else if(epName.match(/[1-9]x[0-9][0-9]/)){
                                epName = "0" + epName.match(/[1-9]x[0-9][0-9]/)[0];
                            }
                            $.ajax({
                                method:"GET",
                                url:"https://cors-anywhere.herokuapp.com/yp1.yayponies.no/subtitles/subs/" + epName + ".srt?callback=?",
                                statusCode: {
                                    404: () => {
                                        console.log("404");
                                        GM_log("GM_log: 404");
                                        $("#subsspinner").fadeOut(0);
                                        $("#subserror").fadeIn(500, function(){
                                            $(this).delay(2500).fadeOut(500);
                                        });
                                        $("#subsplaybutton").css({display:"block"}).siblings().css({display:"none"});
                                    },
                                    429: () => {
                                        GM_log("GM_log: 429 Too many requests");
                                        console.log("429 Too many requests");
                                        $("#subsspinner").fadeOut(0);
                                        $("#subserror").fadeIn(500, function(){
                                            $(this).delay(2500).fadeOut(500);
                                        });
                                    }
                                }
                            }).done(function(data){
                                startSubs(data);
                            });
                        }
                    }
                    if(typeof observerNode === 'undefined'){
                        // Observing node deleting
                        var observerNode = $("#plul")[0];
                        var titleObserver = new MutationObserver(function(mutation){
                            if(mutation[0].removedNodes.length && subsRunning){
                                if(mutation[0].removedNodes[0].className.match("active")){
                                    GM_log("GM_log: subs stopped");
                                    GM_log(mutation);
                                    stopSubs();
                                }
                            }
                        });
                        titleObserver.observe(observerNode, { childList: true });           // childlist    - listening on adding or removing new nodes to main element
                    }
                });
                // Start button end
    
                function startSubs(loadedSubs){
                    console.log("subs loaded");
                    GM_log("GM_log: subs loaded");
                    $("#subsspinner").fadeOut();
                    subsBase = loadedSubs;
                    if(oldTimings.hasOwnProperty(epName))
                        subsMovement = oldTimings[epName];
                    else
                        subsMovement = 0;
                    $("#subsmove").text(subsMovement);
                    part2AddedTime = 0;
                    subsRunning = true;
                    $("#subsstopbutton").css({display:"block"}).siblings().css({display:"none"});
                    clearInterval(subsInterval);
                    nextPos = subsBase.indexOf(" --> ");
                    start = convertTime(subsBase.slice(nextPos - 12, nextPos));
                    end = convertTime(subsBase.slice(nextPos + 5, nextPos + 17));
                    // Add time if part 2
                    switch($("li.active .title").text().toLowerCase()){
                        case "hmx02":
                            part2AddedTime = (49 * 60 + 57) *1000 + 11200;
                            break;
                        case "eqgx02":
                            part2AddedTime = (37 * 60 + 22) *1000;
                            break;
                        case "rrx02":
                            part2AddedTime = (35 * 60 + 35) *1000;
                            break;
                        case "friendshipGames2":                                                //*******************NOT finished********************************************************************************
                            part2AddedTime = 0;
                            break;
                        case "loex02":
                            part2AddedTime = (34 * 60 + 9) *1000;
                            break;
                    }
    
                    PLAYER.getTime(function(playerTime){
                        time = playerTime *1000 + subsMovement + part2AddedTime;
                    });
    
                    begin();
                    // Main interval
                    subsInterval = setInterval(function(){
    //                    console.log("subsinterval");
    //                    console.log("Time: " + time);
    //                    console.log("Start: " + start);
    //                    console.log("End: " + end);
    
                        if(time > start && time < end){
                            if(nextPaused){
                                let subsOutput = subs.match(/-->.*\r*\n(.+\r*\n.*)\r*\n/)[1];
                                $("#subs").html(subsOutput.replace("\n", "<br>"));
    //                            console.log(subsOutput);
    //                            GM_log(subsOutput);
                                nextPaused = false;
                            }
                        } else if(time > end && !nextPaused){
                            next();
                        } else if(time > end){
                            // Reset
                            begin();
                        } else {
                            $("#subs").html("");
                        }
    
                        PLAYER.getTime(function(playerTime){
                            time = playerTime *1000 + subsMovement + part2AddedTime;
                            GM_log("GM_log - time inside function: " + time);
                        });
                        GM_log("GM_log - time after function: " + time);
                    }, 100);
                }
    
                function begin(){
                    // Puts subs in position and removes everything before
                    subs = subsBase;
                    while(end < time){
                        // subs = subs.slice(subsBase.indexOf("-->") + 4);
                        // nextPos = subs.indexOf(" --> ");
                        // start = convertTime(subs.slice(nextPos - 12, nextPos));
                        // end = convertTime(subs.slice(nextPos + 5, nextPos + 17));
                        next(false);
                    }
    //                console.log("begin()");
                    //console.log("nextPos: " + nextPos);
    //                console.log("nextPos start: " + Math.round(start/1000) + " seconds");
    //                console.log("nextPos end: " + Math.round(end/1000) + " seconds");
    
    //                GM_log("GM_log: begin()");
                    //GM_log("GM_log: nextPos: " + nextPos);
    //                GM_log("GM_log: nextPos start: " + Math.round(start/1000) + " seconds");
    //                GM_log("GM_log: nextPos end: " + Math.round(end/1000) + " seconds");
                }
    
                function next(pause = true){                                                // Format:  01:07:32,053 --> 01:07:35,500
                    subs = subs.slice(subs.indexOf("-->") + 4);
                    nextPos = subs.indexOf(" --> ");
                    start = convertTime(subs.slice(nextPos - 12, nextPos));
                    end = convertTime(subs.slice(nextPos + 5, nextPos + 17));
                    nextPaused = pause;
                }
    
                function convertTime(clock){                                    		// Format:  01:07:32,053
                    clock = clock.replace(",", "");
                    let mSeconds = parseInt(clock.slice(6));
                    mSeconds += clock.slice(3, 5) *60000;
                    mSeconds += clock.slice(0, 2) *3600000;
                    return mSeconds;
                }
                function stopSubs(save = true){
                    console.log("subs stopped");
                    $("#subsplaybutton").css({display:"block"});
                    $("#subsstopbutton").css({display:"none"});
                    clearInterval(subsInterval);
                    $("#subs").html("");
                    time = 0;
                    subsRunning = false;
                    if(save && subsMovement){
                        oldTimings[epName] = subsMovement;
                        window.localStorage.subsTimings = JSON.stringify(oldTimings);
                    }
                }
    
                function readUploadedSubs(id){
                    const file = document.getElementById(id).files[0];
                    const reader = new FileReader();
                    reader.onloadend = function(){
                        console.log(reader.result);
                        uploadedSubs = reader.result;
                    };
                    reader.readAsText(file);
                }
            });
    
        // Doesnt exist
        const holidaysUnwrapped = ``;
        const rollercoasterOfFriendship = ``;
        const springBreakdown = ``;
        const sunsetsBackstagePass = ``;
        const rainbowRoadtrip = ``;
        //
    
        GM_addStyle(`
                    .subsbutton{
                        border: 1px solid #118edc;
                        color: #00d4FF;
                        background-color: #000;
                    }
                    .subsbutton:hover{
                        background-color: #004379;
                    }
                    .subsbutton:focus{
                        outline:0;
                    }
                    .subsbutton:active{
                        border-radius: 0 !important;
                        border: 1px solid #4ccfe9 !important;
                        background-color: #000;
                    }
                    #subsfile{
                        position:absolute;
                        top:-150px;
                    }
                    #subshide{
                        border-radius:0 0 4px 0;
                        float:left;
                        height:26px;
                        width:14px;
                        cursor:pointer;
                        padding:5px 0px;
                    }
                    #subsupload{
                        box-sizing:border-box;
                        float:left;
                        height:26px;
                        cursor:pointer;
                        padding-top:4px;
                    }
                    #subsstart{
                        float:left;
                        height:26px;
                        opacity:1;cursor:pointer;
                        padding:1px 3px;
                    }
                    #subsmenuwrapper{
                        position: fixed;
                        top:0;
                        left:0;
                        display:inline-block;
                        z-index:99999;
                        transition:all 0.5s ease;
                    }
                    #subs{
                        transform:translateX(-50%); 
                        width:100%; text-shadow: 3px 3px 3px black;
                        height:30px; 
                        background:transparent; 
                        font-size:28px; 
                        position:absolute; 
                        z-index: 99999; 
                        bottom:14%; 
                        left:50%; 
                        text-align:center;
                    }
                    #subsmenuwrapper *dd{
                        float:left;
                    }
                    #videowrap{
                        position:relative;
                    }
                    #subserror{
                        font-size:18px;
                        background:rgba(0,0,0,0.5);
                        position:absolute;
                        top:100%;
                        padding:4px 4px;
                        display:none;
                        text-shadow: 1px 1px 3px black;
                    }
                    #subsdisabledbutton{
                        cursor:not-allowed;
                        display:none;
                    }
                    #subsplus, #subsminus{
                        float:left;
                        height:26px;
                        cursor:pointer;
                        padding:3px 2px 2px 2px;
                    }
                    #subsmove{
                        float:left;
                        color:white;
                        display:inline-block;
                        padding:3px 5px 0px 5px;
                        text-shadow: 2px 2px 3px black;
                        background:rgba(0, 0, 0, 1);
                        height:26px;
                        box-sizing:border-box'
                    }
                `);
    
    //  "https://api.jsonbin.io/b/5efaf2b70bab551d2b6936ad/1"       //Horse movie
    //  "https://api.jsonbin.io/b/5efb17ca0bab551d2b6945b1"         //friendship games
    //  "https://api.jsonbin.io/b/5efb1940bb5fbb1d25616984"         //forgotten friendship
    //  "https://api.jsonbin.io/b/5efb1a4f7f16b71d48a88f22"         //legends of everyfree
    
    })();
    
