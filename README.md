# gopro-telemetry-dashware-formatter

GPTDF extracts and formats telemetry data from videos shot on GoPro models with GPS and accelerometer logging. It uses [gpmf-extract](https://www.npmjs.com/package/gpmf-extract) and [gopro-telemetry](https://github.com/JuanIrache/gopro-telemetry) for copying the data stream from the video and [ffmpeg](https://ffmpeg.org/) to compress the original video for processing. 

Also included are templates for using the extracted data for gauge overlays within [DashWare](http://www.dashware.net/).
<!-- https://youtu.be/lYMZHFeRw6A -->
<!-- << INCLUDE EXAMPLE VIDEO OF OVERLAYS >> -->
[![gopro video with gauge overlays](https://img.youtube.com/vi/lYMZHFeRw6A/0.jpg)](https://youtu.be/lYMZHFeRw6A)
<!-- << INCLUDE DEMO VIDEO HERE OF USAGE OF SCRIPT AND DASHWARE >> -->

## Installation
### Using a release
You will need [ffmpeg](https://ffmpeg.org/) in your path. A guide to do so can be found [here](). 

Download and extract a [release](), install ffmpeg, and drag a video from your GoPro onto the script. 

The telemetry CSV will appear in the same folder as the input video. This will work for videos copied directly from the camera as well as videos imported via Quik - it will not work for videos already edited in Quik, though, so you'll need to do trimming after the videos have been imported into DashWare. 

### Building via source
Alternatively, if you would prefer to work on the source you can build the script locally.
Use the package manager [npm](https://www.npmjs.com/) to install the requirements.

```bash
npm install
```
If you intend to drag video files onto the script, you'll also need [pkg](https://www.npmjs.com/package/pkg) installed to build the script into a binary executable. 
```bash
# Install pkg globally
npm install -g pkg
# Build the script
pkg index.js -o gptdf
```

## Usage

If you have compiled the script into a binary or have downloaded an exe release, just drag a video directly from the GoPro onto the script. 

In DashWare, import the data format XMLs from the download or source folder. Create a new project, add your video file, add the CSV file and select the data format you just imported, go to the synchronization tab and check the box. 

<!-- Also, you can check out the [demo](). -->

To run from command line:
```bash
node .\index.js   'e:\folder\folder2\folder with spaces\filename.MP4'
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)