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
// ==/UserScript==

(function(){
    'use strict';

        // TO TEST IN HTML must take time using videoLength and background-size                 // Background-size version needs maltweaks to work

        // friendshipGames2                 - NOT FINISHED

        // upload

        // video id ="videowrap"
        // video id ="ytapiplayer" - same but position relative
        // $(".active .title")     - Title of playing now

        // https://jsonbin.io/     - login with Github


        let time = 0, videoLength = 0, part2AddedTime = 0, subsMovement = 0, pos = 0;
        let subsBase, nextPos, start, end, subs, subsInterval;
        let subsRunning = false, nextPaused = true, menuHidden = false;
        const specials = ["HMx01", "forgotten-tc", "forgotten-fc", "LOEx01", "FGx01"];

        $(function(){
            //$("#ytapiplayer").append("<div id=subs></div>");            // Needs to wait few seconds for load of vid
            $("#videowrap").append("<div id=subs></div>");
            $("body").append(`
                <div style='display:inline-block;z-index:99999;transition:all 0.5s ease;position:relative;/*background:rgba(231, 228, 228, 1);*/' id=subsmenuwrapper>
                    <button class="subsbutton" style="float:left;height:26px;opacity:1;cursor:pointer;padding:1px 3px" id=subsStart><!--
                        --><div id=subsdisabledbutton style='cursor:not-allowed;display:none;'><img style="width:17px;padding:2px" src="https://img.icons8.com/ultraviolet/48/000000/cancel-2.png"/></div><!--
                        --><div id=subsplaybutton style='display:block;top:0'><img style="width:21px" src="https://img.icons8.com/fluent/48/000000/circled-play.png"/></div><!--
                        --><div id=subsstopbutton style='display:none;top:0'><img style="width:21px" src="https://img.icons8.com/fluent/48/000000/circled-pause.png"/></div><!--
                    --></button><!--
                    --><button class="subsbutton" style="float:left;height:26px;cursor:pointer;padding:3px 2px 2px 2px;" id=subsplus><img style="width:12px;" src="https://img.icons8.com/offices/30/000000/plus-math.png"/></button><!--
                    --><button class="subsbutton" style="float:left;height:26px;cursor:pointer;padding:3px 2px 2px 2px;" id=subsminus><img style="width:12px;" src="https://img.icons8.com/offices/30/000000/minus-math.png"/></button><!--
                    --><div id=subsmove style='float:left;color:white;display:inline-block;padding:3px 5px 0px 5px;text-shadow: 2px 2px 3px black;background:rgba(0, 0, 0, 1);height:26px;box-sizing:border-box'>0</div><!--
                    --><button class="subsbutton" style="border-radius:0 0 4px 0;float:left;height:26px;width:14px;cursor:pointer;padding:5px 0px;" id=subshide><img style="width:12px;" src="https://img.icons8.com/offices/30/000000/back.png"/></button>
                    <div id=subsspinner style="padding:2px 0px 0 2px;display:none;float:left;">
                        <svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="21px" height="21px" viewBox="0 0 50 50" style="enable-background:new 00 00 50 50;" xml:space="preserve">
                            <path style="fill:#118edc;" fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
                                <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/>
                            </path>
                        </svg>
                    </div>
                    <div id=subserror style="font-size:16px;background:rgba(0,0,0,0.5);position:absolute;top:100%;padding:4px 4px;display:none;text-shadow: 1px 1px 3px black">Not found!</div>
                </div>`);
            $("#subsmenuwrapper").css({position: "fixed", top:0, left:0});
            $("#subs").css({"transform":"translateX(-50%)", "width":"100%", "text-shadow": "3px 3px 3px black", /*"width":"650px",*/ "height":"30px", "background":"transparent", "font-size":"28px", "position":"absolute", "z-index": "99999", "bottom":"14%", "left":"50%", "text-align":"center"});
            $("#subsmenuwrapper *dd").css({"float":"left"});
            $("#videowrap").css({"position":"relative"});

            $("#chatbuffer").css({fontSize:"125%"});
            //$("#subs").html("that is not dead which can eternal lie<br>and with strange aeons...");
            let moveMail = setInterval(() => {
                if($("#mailDiv").length){
                    $("#mailDiv").css({left: "205px"});
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

            // Start subs button
            $("#subsStart").on("click", () => {
                if($("#subsdisabledbutton").css("display") == "block"){
                    console.log("disabled");
                    return;
                }
                if(subsRunning){                    // End subs
                    $("#subsplaybutton").css({display:"block"}).siblings().css({display:"none"});
                    clearInterval(subsInterval);
                    subsRunning = false;
                    $("#subs").html("");
                } else {                            // Start subs
                    let epName = $(".active .title").text();
                    $("#subsspinner").fadeIn();
                    $("#subsdisabledbutton").css({display:"block"}).siblings().css({display:"none"});
                    $("#subs").html("");
                    // Special subs                      - Horse movie, forgotten friendship, legend of everfree, friendship games
                    if(specials.filter(subs => subs.toLowerCase() == epName.replace(/2$/,"1").toLowerCase()).length){
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
                                    $("#subsspinner").fadeOut(0);
                                    $("#subserror").fadeIn(500, function(){
                                        $(this).delay(2500).fadeOut(500);
                                    });
                                    $("#subsplaybutton").css({display:"block"}).siblings().css({display:"none"});
                                },
                                429: () => {
                                    console.log("Too many requests");
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
            });
            // Start button end

            function startSubs(loadedSubs){
                console.log("subs loaded");
                $("#subsspinner").fadeOut();
                // Observing title change
                /*  OLD
                let observerNode = $("#plul")[0];
                let titleObserver = new MutationObserver(function(mutation){
                    console.log("Subs stopped - mutation triggered");
                    if (mutation.type === 'attributes'){
                        console.log("mutation attributes changed");
                    }
                    // End on title change
                    if(subsRunning){
                        $("#subsplaybutton").css({display:"block"});
                        $("#subsstopbutton").css({display:"none"});
                        clearInterval(subsInterval);
                        $("#subs").html("");
                        subsRunning = false;
                    }
                });
                titleObserver.observe(observerNode, { childList: true/*, attributes: true, characterData: true*/ });
                //
                */
            
                /* other version            // observes on delete node, mb add 
                let observerNode = $("#plul")[0];
                let titleObserver = new MutationObserver(function(mutation){
                    console.log("hello");
                    if(mutation[0].removedNodes.length && subsRunning){
                    // End on title change
                        console.log("subs stopped");
                        $("#subsplaybutton").css({display:"block"});
                        $("#subsstopbutton").css({display:"none"});
                        clearInterval(subsInterval);
                        $("#subs").html("");
                        subsRunning = false;
                        titleObserver.disconnect();
                    }
                });
                titleObserver.observe(observerNode, { childList: true });
                */
            
                let observerNode = $(".volatile.active")[0];
                let titleObserver = new MutationObserver(function(mutation){
                    console.log("hello");
                    if(mutation[0].attributeName == "class" && subsRunning){
                    // End on title change
                        console.log("subs stopped");
                        $("#subsplaybutton").css({display:"block"});
                        $("#subsstopbutton").css({display:"none"});
                        clearInterval(subsInterval);
                        $("#subs").html("");
                        subsRunning = false;
                        titleObserver.disconnect();
                    }
                });
                titleObserver.observe(observerNode, { attributes: true });
                
                subsBase = loadedSubs;
                subsMovement = 0;
                part2AddedTime = 0;
                subsRunning = true;
                $("#subsmove").text(subsMovement);
                $("#subsstopbutton").css({display:"block"}).siblings().css({display:"none"});
                clearInterval(subsInterval);
                nextPos = subsBase.indexOf(" --> ");                                        // Format:  01:07:32,053 --> 01:07:35,500
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

                // Takes time from left column and calculates current time from background property
                // videoLength = convt($("li.active .time").text());
                // time = videoLength/100 *(100 - $("li.active").css("background-size").replace("%", "")) *1000 + subsMovement + part2AddedTime;

                PLAYER.getTime(function(playerTime){
                    time = playerTime *1000 + subsMovement + part2AddedTime;
                });
                begin();
                // Main interval
                subsInterval = setInterval(function(){
                    if(time > start && time < end){
                        if(nextPaused){
                            let subsOutput = subs.match(/-->.*\r*\n(.+\r*\n.*)\r*\n/)[1];
                            $("#subs").html(subsOutput.replace("\n", "<br>"));
                            //console.log(subsOutput);
                            nextPaused = false;
                        }
                    } else if(time > end && !nextPaused){
                        next();
                    } else {
                        $("#subs").html("");
                    }
                    //time = videoLength/100 *(100 - $("li.active").css("background-size").replace("%", "")) *1000 + subsMovement + part2AddedTime;

                    PLAYER.getTime(function(playerTime){
                        time = playerTime *1000 + subsMovement + part2AddedTime;
                    });
                }, 250);
            }

            function begin(){
                // Puts subs in position and removes everything before
                subs = subsBase;
                while(end < time){
                    subs = subs.slice(subsBase.indexOf("-->") + 4);
                    nextPos = subs.indexOf(" --> ");
                    start = convertTime(subs.slice(nextPos - 12, nextPos));
                    end = convertTime(subs.slice(nextPos + 5, nextPos + 17));
                }
            }

            function next(){
                subs = subs.slice(subs.indexOf("-->") + 4);
                nextPos = subs.indexOf(" --> ");
                start = convertTime(subs.slice(nextPos - 12, nextPos));
                end = convertTime(subs.slice(nextPos + 5, nextPos + 17));
                nextPaused = true;
            }

            function convt(clock){
                if(clock.length == 5)
                    return parseInt(clock.slice(3)) + clock.slice(0,2) *60;
                else
                    return parseInt(clock.slice(6)) + parseInt(clock.slice(3,5)) *60 + clock.slice(0,2) *3600;
            }
            function convertTime(clock){
                clock = clock.replace(",", "");
                let mSeconds = parseInt(clock.slice(6));
                mSeconds += clock.slice(3, 5) *60000;
                mSeconds += clock.slice(0, 2) *3600000;
                return mSeconds;
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
            `);

//  "https://api.jsonbin.io/b/5efaf2b70bab551d2b6936ad/1"       //Horse movie
//  "https://api.jsonbin.io/b/5efb17ca0bab551d2b6945b1"         //friendship games
//  "https://api.jsonbin.io/b/5efb1940bb5fbb1d25616984"         //forgotten friendship
//  "https://api.jsonbin.io/b/5efb1a4f7f16b71d48a88f22"         //legends of everyfree

})();
