import Prediction from "../models/Prediction.js";


// ==========================================
// Default AI Feature Weights
// ==========================================

const DEFAULT_WEIGHTS = {

  form: 0.20,

  attack: 0.20,

  defense: 0.15,

  venue: 0.10,

  expectedGoals: 0.15,

  scoreProbability: 0.10,

  dataQuality: 0.05,

  consensus: 0.05,

};



// ==========================================
// Helpers
// ==========================================

function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}



function normalize(weights) {

  const total =
    Object.values(weights)
      .reduce(
        (sum, value) =>
          sum + value,
        0
      );


  if (!total) {
    return DEFAULT_WEIGHTS;
  }


  const result = {};


  Object.keys(weights)
    .forEach(key => {

      result[key] =
        Number(
          (
            weights[key] /
            total
          ).toFixed(3)
        );

    });


  return result;

}



function average(values) {

  if (!values.length)
    return 50;


  return (
    values.reduce(
      (a,b)=>a+b,
      0
    )
    /
    values.length
  );

}



function featureDifference(
  wins,
  losses,
  selector
){

  const winAverage =
    average(
      wins.map(selector)
    );


  const lossAverage =
    average(
      losses.map(selector)
    );


  return (
    winAverage -
    lossAverage
  ) / 100;

}



// ==========================================
// Main Learning Engine
// ==========================================

export async function getFeatureWeights(){

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



  if(predictions.length < 50){

    return DEFAULT_WEIGHTS;

  }



  const wins =
    predictions.filter(
      p =>
      p.result === "WIN"
    );



  const losses =
    predictions.filter(
      p =>
      p.result === "LOSS"
    );



  const weights = {

    form:
      DEFAULT_WEIGHTS.form,

    attack:
      DEFAULT_WEIGHTS.attack,

    defense:
      DEFAULT_WEIGHTS.defense,

    venue:
      DEFAULT_WEIGHTS.venue,

    expectedGoals:
      DEFAULT_WEIGHTS.expectedGoals,

    scoreProbability:
      DEFAULT_WEIGHTS.scoreProbability,

    dataQuality:
      DEFAULT_WEIGHTS.dataQuality,

    consensus:
      DEFAULT_WEIGHTS.consensus,

  };



  // ==============================
  // Team Form Learning
  // ==============================

  weights.form =
    clamp(
      weights.form +
      featureDifference(
        wins,
        losses,
        p =>
        p.ratings?.form ?? 50
      ),

      0.05,
      0.40
    );



  // ==============================
  // Attack Learning
  // ==============================

  weights.attack =
    clamp(
      weights.attack +
      featureDifference(
        wins,
        losses,
        p =>
        p.ratings?.attack ?? 50
      ),

      0.05,
      0.40
    );



  // ==============================
  // Defense Learning
  // ==============================

  weights.defense =
    clamp(
      weights.defense +
      featureDifference(
        wins,
        losses,
        p =>
        p.ratings?.defense ?? 50
      ),

      0.05,
      0.35
    );



  // ==============================
  // Home Advantage Learning
  // ==============================

  weights.venue =
    clamp(
      weights.venue +
      featureDifference(
        wins,
        losses,
        p =>
        p.ratings?.venue ?? 50
      ),

      0.05,
      0.30
    );



  // ==============================
  // Expected Goals Learning
  // ==============================

  weights.expectedGoals =
    clamp(
      weights.expectedGoals +
      featureDifference(
        wins,
        losses,
        p =>
        p.features?.expectedGoals ?? 50
      ),

      0.05,
      0.30
    );



  // ==============================
  // Score Prediction Learning
  // ==============================

  weights.scoreProbability =
    clamp(
      weights.scoreProbability +
      featureDifference(
        wins,
        losses,
        p =>
        p.features?.scoreProbability ?? 50
      ),

      0.05,
      0.25
    );



  // ==============================
  // Data Quality Learning
  // ==============================

  weights.dataQuality =
    clamp(
      weights.dataQuality +
      featureDifference(
        wins,
        losses,
        p =>
        p.features?.dataQuality ?? 50
      ),

      0.01,
      0.20
    );



  // ==============================
  // Consensus Learning
  // ==============================

  weights.consensus =
    clamp(
      weights.consensus +
      featureDifference(
        wins,
        losses,
        p =>
        p.features?.consensus ?? 50
      ),

      0.01,
      0.20
    );



  return normalize(weights);

}



// ==========================================
// Analytics
// ==========================================

export async function getFeatureImportance(){

  const weights =
    await getFeatureWeights();


  return {

    weights,

    samples:
      await Prediction.countDocuments({

        validated:true,

        result:{
          $in:[
            "WIN",
            "LOSS"
          ]
        }

      }),


    generatedAt:
      new Date().toISOString(),


    version:
      "4.0.0",

  };

}



// ==========================================
// Manual Retrain
// ==========================================

export async function retrainFeatureWeights(){

  const weights =
    await getFeatureWeights();


  return {

    success:true,

    weights,

    retrainedAt:
      new Date().toISOString(),

  };

}