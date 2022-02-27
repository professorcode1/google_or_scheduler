const fs = require("fs");
const WorkerGlobalScope = require("graph");
const { MongoClient } = require('mongodb');

const url = "mongodb+srv://admin-Raghav:@cluster0.tbblr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(url);

// Database Name
const dbName = 'CollegeScheduler';


const ScheduleGenerator = (user) => {
    console.log("ScheduleGenerator :: Called");
    const {
        numberOfDays,
        periodsPerDay,
        periods,
        groups,
        rooms,
        professors: profs
    } = user;
    let schedulerGraph = new WorkerGlobalScope.Graph();
    let integrity = true; 
    //Initialising Graph Below
    {
        console.log("Initialising graph");
        for (let lpitrt = 1; lpitrt < numberOfDays * periodsPerDay; lpitrt++)
            for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                schedulerGraph.set(lpitrt, lpitrt1);
        console.log(rooms);
        for (const room of rooms) {

            for (let lpitrt = 0; lpitrt < room.periodsUsedIn.length; lpitrt++) {
                for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                    schedulerGraph.set(String(room.periodsUsedIn[lpitrt]) + "Period0", String(room.periodsUsedIn[lpitrt1]) + "Period0");


                for (const roomUnavailabiliy of room.unAvialability)
                    schedulerGraph.set(roomUnavailabiliy, String(room.periodsUsedIn[lpitrt]) + "Period0");
            }
            let roomUsage = 0;
            for(const periodId of room.periodsUsedIn){
                period = periods.find(p => String(p._id) == periodId);
                roomUsage += period.periodLength * period.periodFrequency
                console.log(period.periodLength, period.periodFrequency)
            }
            console.log(roomUsage);
            if(roomUsage > numberOfDays * periodsPerDay){
                integrity = false;
            }
        }

        console.log("Initialise::Rooms Complete");

        for (const prof of profs) {
            for (let lpitrt = 0; lpitrt < prof.periodsTaken.length; lpitrt++) {
                for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                    schedulerGraph.set(String(prof.periodsTaken[lpitrt]) + "Period0", String(prof.periodsTaken[lpitrt1]) + "Period0");


                for (const profUnavailabiliy of prof.unAvialability)
                    schedulerGraph.set(profUnavailabiliy, String(prof.periodsTaken[lpitrt]) + "Period0");
            }

            let profUsage = 0;
            for(const periodId of prof.periodsTaken){
                period = periods.find(p => String(p._id) == periodId);
                profUsage += period.periodLength * period.periodFrequency
            }
            console.log(profUsage);
            if(profUsage > numberOfDays * periodsPerDay){
                integrity = false;
            }
        }
        console.log("Initialise::Prof Done");

        for (const group of groups) {
            for (let lpitrt = 0; lpitrt < group.periodsAttended.length; lpitrt++) {
                for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                    schedulerGraph.set(String(group.periodsAttended[lpitrt]) + "Period0", String(group.periodsAttended[lpitrt1]) + "Period0");


                for (const groupUnavailabiliy of group.unAvialability)
                    schedulerGraph.set(groupUnavailabiliy, String(group.periodsAttended[lpitrt]) + "Period0");
            }
            let groupUsage = 0;
            for(const periodId of group.periodsAttended){
                period = periods.find(p => String(p._id) == periodId);
                groupUsage += period.periodLength * period.periodFrequency
            }
            console.log(groupUsage);
            if(groupUsage > numberOfDays * periodsPerDay){
                integrity = false;
            }
        }
        console.log("Initialise::Group Done");

        for (const period of periods) {
            console.log("Initialise::" + period.periodName);
            for (let len = 1; len < Number(period.periodLength); len++) {

                const thisPeriodNode = String(period._id) + "Period" + String(len);

                for (const node in schedulerGraph._graph[String(period._id) + "Period0"])
                    schedulerGraph.set(node, thisPeriodNode);

                for (let itrt = Number(period.periodLength) - 1 - len; itrt > 0; itrt--)
                    for (let day = 0; day < numberOfDays; day++)
                        schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, thisPeriodNode);

                for (let itrt = 0; itrt < len; itrt++)
                    for (let day = 0; day < numberOfDays; day++)
                        schedulerGraph.set(day * periodsPerDay + itrt, thisPeriodNode);
            }

            if (period.periodFrequency == 1) {

                if (period.periodTime != -1) {

                    for (let lpitrt = 0; lpitrt < numberOfDays * periodsPerDay; lpitrt++)
                        if (lpitrt != period.periodTime)
                            schedulerGraph.set(lpitrt, String(period._id) + "Period0");
                } else if (period.periodAntiTime.length != 0) {

                    for (const antiTime of period.periodAntiTime)
                        for (let perLen = 0; perLen < period.periodLength; perLen++)
                            if (Number(antiTime) + perLen < numberOfDays * periodsPerDay)
                                schedulerGraph.set(Number(antiTime) + perLen, String(period._id) + "Period" + String(perLen));
                }
            }


            for (let itrt = Number(period.periodLength) - 1; itrt > 0; itrt--)
                for (let day = 0; day < numberOfDays; day++)
                    schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, String(period._id) + "Period0");

            for (let len = 1; len < Number(period.periodLength); len++)
                for (let len1 = 0; len1 < len; len1++)
                    schedulerGraph.set(String(period._id) + "Period" + String(len), String(period._id) + "Period" + String(len1));
        }
        let hlprGraph = schedulerGraph.copy();
        schedulerGraph = new WorkerGlobalScope.Graph();

        for (let i = 0; i < numberOfDays * periodsPerDay; i++)
            for (let j = 0; j < i; j++)
                schedulerGraph.set(i, j);

        for (const period of periods)
            for (let freq = 0; freq < Number(period.periodFrequency); freq++)
                for (let len = 0; len < Number(period.periodLength); len++) {
                    const thisPeriodNode = String(period._id) + "Period" + String(len) + "Freq" + String(freq);

                    //a corner case someone can use to break the application is to make 1 period for a university with 1 day and 1 period per day
                    //thus creating a graph in which case neither the nodes will come into existence since the graph is intialised via edges
                    //to avoide that edge case i.e. any graph with disjoint nodes,all nodes are first attached then detacched from 0,to create the nodes
                    schedulerGraph.set(0, thisPeriodNode);
                    schedulerGraph.del(0, thisPeriodNode);

                    for (let freq1 = 0; freq1 < freq; freq1++)
                        for (let len1 = 0; len1 < Number(period.periodLength); len1++)
                            schedulerGraph.set(thisPeriodNode, String(period._id) + "Period" + String(len1) + "Freq" + String(freq1))

                    for (const neighborNode in hlprGraph.adj(String(period._id) + "Period" + String(len)))
                        if (String(neighborNode).length > 24) {
                            let neighborPeriod = periods.find(periodItrt => String(periodItrt._id) == neighborNode.slice(0, 24));
                            for (let freq1 = 0; freq1 < Number(neighborPeriod.periodFrequency); freq1++)
                                schedulerGraph.set(thisPeriodNode, neighborNode + "Freq" + String(freq1));
                        } else
                            schedulerGraph.set(thisPeriodNode, neighborNode);

                }

        //Checking if every node is colorable
        //i.e. the ban time + set times for the period and its resources don't contradict itself.
        for (const node in schedulerGraph._graph) {
            let inConflict = true;
            for (let periodNumber = 0; periodNumber < numberOfDays * periodsPerDay; periodNumber++)
                inConflict = inConflict && schedulerGraph.has(node, periodNumber);
            if (inConflict) {
                period = periods.find(p => String(p._id) == String(node).slice(0, 24));
                console.log("WARNING:The period " + period.periodName + " causing impossible time table config.");
                integrity = false;
            }
        }

    }
    var graph_to_json = new Object();
    graph_to_json["Colors"] = numberOfDays * periodsPerDay;
    graph_to_json["Period Data"] = periods.map((x) => new Object({name:String(x._id) , length : x.periodLength , frequency : x.periodFrequency}) );
    var edges_for_json = [];
    for (const node of schedulerGraph._vertices) {
        for (const nodeNeighbor in schedulerGraph._graph[node]) {
            edges_for_json.push({left:String(node), right:String(nodeNeighbor)});
        }
    }
    graph_to_json["Edge Data"] = edges_for_json;

    return graph_to_json;
};
const funk = async () => {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    const myData = await collection.find({username:"raghkum2000@gmail.com"}).toArray();
    fs.writeFileSync('./database.json', JSON.stringify(myData[0], null, 2));
    graph_to_json = ScheduleGenerator(myData[0]);
    const jsonString = JSON.stringify(graph_to_json, null, 2);
    fs.writeFileSync('./graphJson.json', jsonString);
    return console.log("Done");
};
funk();