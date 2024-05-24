// Written by Lukas Radl, April 2024
// Adapted from the following sources
// Ref-NeRF     https://dorverbin.github.io/refnerf/
// Reconfusion  https://reconfusion.github.io/
// DICS         https://github.com/abelcabezaroman/definitive-image-comparison-slider
var position = 0.25
var leftButtonDown = false
var strokeColor = "#FFFFFFDD";

var vidShow = 2;
var currentSceneFLIP = 'garden';
currentButtonFLIP = 'btn_flip0';

function changeFLIP(flip_t) {
    // flip_t
    // 1 -> FLIP_1
    // 7 -> FLIP_7
    // 0 -> Video comparison

    document.getElementById(currentButtonFLIP).classList.remove('button-17-selected');
    document.getElementById(currentButtonFLIP).classList.add('button-17');

    currentButtonFLIP = 'btn_flip' + flip_t;
    document.getElementById(currentButtonFLIP).classList.remove('button-17');
    document.getElementById(currentButtonFLIP).classList.add('button-17-selected');

    if (flip_t == 1){
        vidShow = 0;
    }
    else if (flip_t == 7) {
        vidShow = 1;
    }
    else {
        vidShow = 2;
    }
}

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var vidWidth = vid.videoWidth/2;


    var subVidHeight = vid.videoHeight / 3;
    var interm_pos = 0;

    var mergeContext = videoMerge.getContext("2d");
    
    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.pageX - bcr.x) / bcr.width);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.touches[0].pageX - bcr.x) / bcr.width);
        }

        videoMerge.addEventListener("mousemove",  trackLocation, false); 
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove",  trackLocationTouch, false);


        function drawLoop() {
            mergeContext.drawImage(vid, 0, vidShow * subVidHeight, vidWidth, subVidHeight, 0, 0, vidWidth, subVidHeight);
            var colStart = (vidWidth * position).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - (vidWidth * position)).clamp(0.0, vidWidth);
            mergeContext.drawImage(vid, colStart+vidWidth, vidShow * subVidHeight, colWidth, subVidHeight, colStart, 0, colWidth, subVidHeight);
            requestAnimationFrame(drawLoop);

            var currX = vidWidth * position;
            
            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth*position, 0);
            mergeContext.lineTo(vidWidth*position, subVidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = strokeColor;
            mergeContext.lineWidth = 2;            
            mergeContext.stroke();

            var arrowPosY2 = subVidHeight / 2;
            var arrowW = subVidHeight / 70;
            var arrowL = subVidHeight / 150;
            var arrowoffsetL = subVidHeight / 150;

            // draw (similar to dics)
            mergeContext.beginPath();
            mergeContext.moveTo(currX + arrowL + arrowoffsetL, arrowPosY2 - arrowW/2);
            mergeContext.lineTo(currX + 2*arrowL + arrowoffsetL, arrowPosY2 );
            mergeContext.lineTo(currX + arrowL + arrowoffsetL, arrowPosY2 + arrowW/2);

            mergeContext.strokeStyle = strokeColor;
            mergeContext.stroke();

            // draw (similar to dics)
            mergeContext.beginPath();
            mergeContext.moveTo(currX - arrowL - arrowoffsetL, arrowPosY2 - arrowW/2);
            mergeContext.lineTo(currX - 2*arrowL - arrowoffsetL, arrowPosY2 );
            mergeContext.lineTo(currX - arrowL - arrowoffsetL, arrowPosY2 + arrowW/2);

            mergeContext.strokeStyle = strokeColor;
            mergeContext.stroke();
            
        }
        requestAnimationFrame(drawLoop);
    } 
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function changeSceneFLIP(scene) {
    var video = document.getElementById('flipvideo');
    var new_src = 'video/' + scene.toLowerCase() + '_video_loop.mp4'

    if (currentSceneFLIP == scene.toLowerCase()) {
        return;
    }
    document.getElementById('btn_' + currentSceneFLIP + '_flip').classList.remove('button-17-selected');
    document.getElementById('btn_' + currentSceneFLIP + '_flip').classList.add('button-17');

    currentSceneFLIP = scene.toLowerCase();

    document.getElementById('btn_' + currentSceneFLIP + '_flip').classList.remove('button-17');
    document.getElementById('btn_' + currentSceneFLIP + '_flip').classList.add('button-17-selected');
    video.src = new_src;
}
    
function resizeAndPlay(element)
{
  var cv = document.getElementById(element.id + "Merge");
  cv.width = element.videoWidth/2;
  cv.height = element.videoHeight /3;
  element.play();
  element.style.height = "0px";  // Hide video without stopping it
    
  playVids(element.id);
}
