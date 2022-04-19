/*
Gopro telemetry extractor for DashWare videos
Author: Shawn Rast <shawn@rast.dev>

installation: Make sure you have ffmpeg in your path, then if you don't have the binary, package with pkg
usage: package with "pkg index.js -o script", then drag the video file onto script.exe
outputs a csv with telemetry data in the same dir as the source video

This has no error handling and is likely brittle. It shouldn't delete input files, but having a backup isn't a bad idea. 
*/

/*
How it works: 

First, get the filename, extension, and working path. 

Then, call ffmpeg to create a very compressed version of the file. 
  This is because the later video editing will use the input video (so the compression doesn't hurt quality), and
  node won't work with files greater than 2 gigabytes. We use the compressed (<2GB) file to get the telemetry, which isn't damaged in the compression. 

Then, extract the gopro telemetry data from the file using gpmf-extract and gopro-telemetry.

Then write the results to a CSV for import into DashWare. 
*/

const gpmfExtract = require('gpmf-extract');
const goproTelemetry = require(`gopro-telemetry`);
const fs = require('fs');
const { spawn } = require("child_process");
const path = require("path");


// getting file and folder info
let i_file_full_path = process.argv[2];
let vidName = path.parse(i_file_full_path).name;
let inputdir = path.dirname(i_file_full_path);
let outputFFmpegName = vidName + '-smaller-delete-me.mp4';


// writes a file to the script dir with a compressed version of the input file
function compressWithFFMpeg() {
  return new Promise((resolve, reject) => {
    // .\ffmpeg.exe -i GH010050.MP4 -vf scale=320:-1 -map 0:0 -map 0:1 -map 0:3 -codec:v mpeg2video -codec:d copy -codec:a copy -y GH010050-small.MP4
    const ffmpeg = spawn("ffmpeg.exe", ["-i", i_file_full_path, "-vf", "scale=320:-1", "-map", "0:0", "-map", "0:1", "-map", "0:3", "-codec:v", "mpeg2video", "-codec:d", "copy", "-codec:a", "copy", "-y", path.format({dir: inputdir, base: outputFFmpegName})]);

    ffmpeg.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });
    
    ffmpeg.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
    
    ffmpeg.on('error', (error) => {
        console.log(`error: ${error.message}`);
    });
    
    ffmpeg.on("close", code => {
        console.log(`child process exited with code ${code}`);
        resolve();
    });
  })
}


// get the telemetry data out of the compressed file and write to a csv
async function extractTelemetry() {
  let frameWidth = 50; // time in ms each frame is;
  let getIndexFromCts = function(cts) {
    return Math.round(cts / frameWidth);
  }
  
  const inputFile = fs.readFileSync(path.format({dir: inputdir, base: outputFFmpegName}));

  let extracted = await gpmfExtract(inputFile);
  return new Promise((resolve, reject) => {
    goproTelemetry(extracted, {/*preset: "csv", */groupTimes: frameWidth, disableMerging: false, stream: ["GPS5", "ACCL", "GYRO"], removeGaps: true, repeatSticky: true, repeatHeaders: true, smooth: 3}, telemetry => {
      Object.keys(telemetry).forEach((key) => {
        console.log(key);
      })

      let ctsDict = {};
      let timeDict = {};

      let streams = telemetry["1"].streams;
      //let numFrames = streams.ACCL.samples.length;

      //for (let i = 0; i< numFrames; i++) {
      Object.keys(streams).forEach((streamKey) => {
        let lowerCaseStreamKeyFirstThreeChars = streamKey.substr(0, 3).toLowerCase();
        let streamSamples = streams[streamKey].samples;

        // RULE: if the object key matches the first three chars of the stream key, 
        // only then do we write them
        streamSamples.forEach((sample) => {
          Object.keys(sample).forEach((sampleKey) => {
            let lowerCaseSampleKeyFirstThreeChars = sampleKey.substr(0, 3).toLowerCase();
            if (lowerCaseStreamKeyFirstThreeChars === lowerCaseSampleKeyFirstThreeChars) {

              let timeIndex = getIndexFromCts(sample.cts);

              // if it doesn't exist yet:
              if (!(timeDict[timeIndex])) {
                timeDict[timeIndex] = {
                  cts: sample.cts / 1000
                };
              }
              //console.log(sample);
              timeDict[timeIndex][sampleKey] = sample[sampleKey];
              
            }
          })
        });
      });

      // now turn the cts dict into a csv
      // get the headers from the first row of the file
      let timeDictKeys = Object.keys(timeDict);
      let headers = Object.keys(timeDict[timeDictKeys[0]]);
      //headers.push("time in seconds");

      let csv = headers.map((header) => { return `"${header}"`; }).join();
      Object.keys(timeDict).forEach((index) => {


        let currentFrameKeys = Object.keys(timeDict[index]);
        if (currentFrameKeys.length !== headers.length) {
          // throw out frames that don't have all the data
          return;
        }
        csv += "\r\n";
        let valuesArr = currentFrameKeys.map((key) => {
          return `"${timeDict[index][key]}"`;
        });
        csv += valuesArr.join();
      });
      
      fs.writeFileSync(path.format({dir: inputdir, base: `${vidName}.csv`}), csv);
      console.log('Telemetry saved as CSV');
      resolve();
    });
  });

 
}


async function main() {
  try {
    await compressWithFFMpeg();
 
    await extractTelemetry();
    
    // delete the compressed video file now that the telemetry has been extracted
    fs.unlinkSync(path.format({dir: inputdir, base: outputFFmpegName}));
  } catch (e) {
    // the window just disappears after an error is printed, so do this to keep the window alive
    while (true) {
      console.log(e);
    }
  }

}

main();
