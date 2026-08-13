// server/services/learningService.js

import Prediction from "../models/Prediction.js";



function round(value){

    return Number(
        Number(value).toFixed(3)
    );

}



function calculateAccuracy(items = []){

    if(!items.length)
        return 0;


    const wins =
        items.filter(
            item => item.result === "WIN"
        ).length;


    return wins / items.length;

}




function getConfidenceBand(confidence = 0){

    if(confidence >= 90)
        return "90-99";

    if(confidence >= 80)
        return "80-89";

    if(confidence >= 70)
        return "70-79";

    if(confidence >= 60)
        return "60-69";


    return "50-59";

}




function calculateWeight(accuracy){

    return round(
        0.8 + (accuracy * 0.4)
    );

}





// =====================================
// AI ADAPTIVE TRAINING
// =====================================

export async function trainAdaptiveWeights(){

    console.log(
        "🧠 Learning engine started..."
    );


    const predictions =
        await Prediction.find({

            validated:true,

            result:{
                $in:[
                    "WIN",
                    "LOSS"
                ]
            }

        }).lean();



    if(predictions.length < 20){

        return {

            success:false,

            reason:
                "Not enough validated predictions.",

            samples:
                predictions.length,

        };

    }




    const leagueGroups = {};

    const marketGroups = {};

    const confidenceGroups = {};





    for(const prediction of predictions){


        const league =
            prediction.league ||
            "Unknown";


        const market =
            prediction.prediction ||
            "Unknown";



        const confidence =
            getConfidenceBand(
                prediction.confidence
            );



        if(!leagueGroups[league])
            leagueGroups[league]=[];


        if(!marketGroups[market])
            marketGroups[market]=[];


        if(!confidenceGroups[confidence])
            confidenceGroups[confidence]=[];



        leagueGroups[league]
            .push(prediction);


        marketGroups[market]
            .push(prediction);


        confidenceGroups[confidence]
            .push(prediction);


    }





    function buildWeights(groups){

        const result={};


        for(
            const [key,items]
            of Object.entries(groups)
        ){

            result[key]=
                calculateWeight(
                    calculateAccuracy(
                        items
                    )
                );

        }


        return result;

    }




    const adaptiveWeights={


        version:
            "5.0.0",


        generatedAt:
            new Date(),


        samples:
            predictions.length,


        leagueWeights:
            buildWeights(
                leagueGroups
            ),



        marketWeights:
            buildWeights(
                marketGroups
            ),



        confidenceWeights:
            buildWeights(
                confidenceGroups
            ),


    };




    const latest =
        await Prediction.findOne()
            .sort({
                createdAt:-1
            });



    if(latest){

        latest.adaptiveWeights =
            adaptiveWeights;


        await latest.save();

    }




    console.log(
        "✅ Learning completed:",
        predictions.length,
        "samples"
    );



    return {

        success:true,

        ...adaptiveWeights,

    };

}








// =====================================
// FIXTURE VALIDATION
// =====================================


function evaluateMarket(
    prediction,
    homeGoals,
    awayGoals
){


    const total =
        homeGoals +
        awayGoals;



    switch(
        prediction.prediction
    ){


        case "Home Win":
            return homeGoals > awayGoals;



        case "Away Win":
            return awayGoals > homeGoals;



        case "Draw":
            return homeGoals === awayGoals;



        case "Double Chance 1X":
            return homeGoals >= awayGoals;



        case "Double Chance X2":
            return awayGoals >= homeGoals;



        case "Double Chance 12":
            return homeGoals !== awayGoals;



        case "Over 1.5 Goals":
            return total >= 2;



        case "Over 2.5 Goals":
            return total >= 3;



        case "Over 3.5 Goals":
            return total >= 4;



        case "Under 2.5 Goals":
            return total <= 2;



        case "BTTS Yes":
            return (
                homeGoals > 0 &&
                awayGoals > 0
            );



        case "BTTS No":
            return (
                homeGoals === 0 ||
                awayGoals === 0
            );



        default:
            return false;

    }

}






export async function evaluateFinishedFixture(
    fixture
){


    const prediction =
        await Prediction.findOne({

            fixtureId:
                fixture.fixture.id

        });



    if(!prediction)
        return null;




    const homeGoals =
        fixture.goals?.home;


    const awayGoals =
        fixture.goals?.away;




    if(
        homeGoals === null ||
        awayGoals === null ||
        homeGoals === undefined ||
        awayGoals === undefined
    ){

        return null;

    }




    const status =
        fixture.fixture.status.short;




    prediction.status =
        status;



    prediction.actualResult =
        `${homeGoals}-${awayGoals}`;





    if(
        ![
            "FT",
            "AET",
            "PEN"
        ].includes(status)
    ){

        prediction.result =
            "VOID";


        prediction.validated =
            true;


        await prediction.save();


        return prediction;

    }





    const won =
        evaluateMarket(
            prediction,
            homeGoals,
            awayGoals
        );



    prediction.result =
        won
            ? "WIN"
            : "LOSS";



    prediction.predictionCorrect =
        won;



    prediction.validated =
        true;



    prediction.accuracyScore =
        won
            ? 100
            : 0;



    prediction.finishedAt =
        new Date();




    await prediction.save();



    return prediction;

}








export async function evaluateFinishedFixtures(
    fixtures=[]
){

    const results=[];



    for(
        const fixture
        of fixtures
    ){

        const result =
            await evaluateFinishedFixture(
                fixture
            );


        if(result)
            results.push(result);

    }



    return results;

}